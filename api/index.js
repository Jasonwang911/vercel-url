const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url, count = 1, action = 'visit' } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少URL参数'
      });
    }

    // 验证URL格式
    if (!url.includes('club.autohome.com.cn')) {
      return res.status(400).json({
        success: false,
        error: '必须是汽车之家论坛URL'
      });
    }

    let result;
    
    if (action === 'visit') {
      result = await increaseViewCount(url, parseInt(count));
    } else if (action === 'info') {
      result = await getPageInfo(url);
    } else {
      return res.status(400).json({
        success: false,
        error: '不支持的操作类型'
      });
    }

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// 增加访问量
async function increaseViewCount(url, count = 1) {
  const results = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const result = await visitUrl(url);
      results.push(result);
      
      // 添加延迟避免频繁访问
      if (i < count - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, 1000 + Math.random() * 2000)
        );
      }
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        attempt: i + 1
      });
    }
  }
  
  return {
    total: count,
    successes: results.filter(r => r.success).length,
    failures: results.filter(r => !r.success).length,
    attempts: results
  };
}

// 访问单个URL
async function visitUrl(url) {
  let browser = null;
  
  try {
    // Vercel环境下的浏览器配置
    const browserOptions = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080'
      ],
      executablePath: await chrome.executablePath,
      headless: chrome.headless
    };

    browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();

    // 设置随机用户代理
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
    ];
    
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
    await page.setViewport({ width: 1920, height: 1080 });

    // 导航到页面
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 模拟用户行为
    await simulateRealUser(page);

    // 获取访问量信息
    const viewCount = await getViewCount(page);
    
    await browser.close();
    
    return {
      success: true,
      url: url,
      viewCount: viewCount,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// 获取页面信息
async function getPageInfo(url) {
  let browser = null;
  
  try {
    const browserOptions = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security'
      ],
      executablePath: await chrome.executablePath,
      headless: chrome.headless
    };

    browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    const pageInfo = await page.evaluate(() => {
      const title = document.title;
      const url = window.location.href;
      
      // 尝试获取访问量
      const selectors = [
        '.post-view',
        '.views',
        '.read-count',
        '[class*="view"]',
        '[class*="read"]'
      ];
      
      let viewCount = '未知';
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          viewCount = element.textContent.trim();
          break;
        }
      }
      
      return { title, url, viewCount };
    });

    await browser.close();
    
    return pageInfo;
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// 模拟真实用户行为
async function simulateRealUser(page) {
  // 随机滚动
  await page.evaluate(() => {
    window.scrollBy(0, Math.random() * 500 + 200);
  });
  
  // 随机等待
  await page.waitForTimeout(Math.random() * 3000 + 1000);
  
  // 模拟鼠标移动
  await page.mouse.move(
    Math.random() * 800,
    Math.random() * 600
  );
}

// 获取访问量
async function getViewCount(page) {
  return await page.evaluate(() => {
    const selectors = [
      '.post-view',
      '.views',
      '.read-count',
      '[class*="view"]',
      '[class*="read"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        return element.textContent.trim();
      }
    }
    return '未知';
  });
}