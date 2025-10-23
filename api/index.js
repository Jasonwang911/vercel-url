const express = require('express');
const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 测试接口
app.get('/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '服务已成功启动并运行',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: true,
    request: {
      method: req.method,
      path: req.path,
      query: req.query
    }
  });
});

// 主页
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Vercel Node.js 服务</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; }
        .info { background: #f0f8ff; padding: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>🚀 Vercel Node.js 服务</h1>
      <div class="info">
        <p><strong>状态:</strong> <span class="success">运行正常</span></p>
        <p><strong>Node.js 版本:</strong> ${process.version}</p>
        <p><strong>环境:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>时间:</strong> ${new Date().toISOString()}</p>
      </div>
      
      <h2>可用接口:</h2>
      <ul>
        <li><a href="/test">/test</a> - 测试服务状态</li>
        <li><a href="/api">/api</a> - API 接口</li>
      </ul>
      
      <h2>测试命令:</h2>
      <pre>curl ${req.protocol}://${req.get('host')}/test</pre>
    </body>
    </html>
  `);
});

// API 接口
app.get('/api', (req, res) => {
  res.json({
    service: 'Vercel Node.js API',
    version: '1.0.0',
    endpoints: {
      '/test': '测试服务状态',
      '/api': 'API信息'
    },
    timestamp: new Date().toISOString()
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: '未找到请求的资源',
    path: req.path
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? '内部服务器错误' : err.message
  });
});

// Vercel 需要导出 app
module.exports = app;