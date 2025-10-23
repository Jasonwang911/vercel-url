const express = require('express');
const app = express();

// 设置中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加测试路由
app.get('/test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '服务已成功启动并运行',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: true
  });
});

// 添加其他路由
app.get('/', (req, res) => {
  res.send(`
    <h1>汽车之家论坛访问服务</h1>
    <p>服务已成功运行！</p>
    <p>Node版本: ${process.version}</p>
    <p>尝试访问 <a href="/test">/test</a> 接口进行测试</p>
  `);
});

// 处理404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: '未找到请求的资源',
    path: req.path
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? '内部服务器错误' : err.message
  });
});

// 导出Express应用（Vercel要求）
module.exports = app;