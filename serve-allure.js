#!/usr/bin/env node
/**
 * Allure报告HTTP服务器
 * 用于在本地通过HTTP协议访问Allure报告，避免file://协议的CORS限制
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const REPORT_DIR = path.join(__dirname, 'allure-report');

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webm': 'video/webm',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  // 处理根路径
  let filePath = req.url === '/' ? 'index.html' : req.url;
  filePath = path.join(REPORT_DIR, filePath);
  
  // 获取文件扩展名
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  // 读取文件
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>404 - File Not Found</title></head>
            <body>
              <h1>404 - File Not Found</h1>
              <p>请求的文件不存在: ${req.url}</p>
              <p><a href="/">返回首页</a></p>
            </body>
          </html>
        `);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>500 - Server Error</title></head>
            <body>
              <h1>500 - Server Error</h1>
              <p>服务器错误: ${err.code}</p>
            </body>
          </html>
        `);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// 检查报告目录是否存在
if (!fs.existsSync(REPORT_DIR)) {
  console.error(`❌ 错误: 报告目录不存在: ${REPORT_DIR}`);
  console.error('请先运行测试生成Allure报告:');
  console.error('  python -m pytest --alluredir=allure-results');
  console.error('  allure generate allure-results -o allure-report --clean');
  process.exit(1);
}

// 启动服务器
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Allure报告HTTP服务器已启动');
  console.log('='.repeat(60));
  console.log(`📊 报告地址: http://localhost:${PORT}`);
  console.log(`📁 报告目录: ${REPORT_DIR}`);
  console.log('='.repeat(60));
  console.log('💡 提示: 按 Ctrl+C 停止服务器');
  console.log('');
  
  // 尝试自动打开浏览器（仅在macOS/Linux上）
  if (process.platform === 'darwin') {
    require('child_process').exec(`open http://localhost:${PORT}`);
  } else if (process.platform === 'linux') {
    require('child_process').exec(`xdg-open http://localhost:${PORT}`);
  } else if (process.platform === 'win32') {
    require('child_process').exec(`start http://localhost:${PORT}`);
  }
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

