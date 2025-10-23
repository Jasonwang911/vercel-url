module.exports = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '测试接口运行正常',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: true,
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      headers: req.headers
    }
  });
};