import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 文件编码转换服务已启动`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
}); 
