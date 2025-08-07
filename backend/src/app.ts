import express from 'express';
import cors from 'cors';
import path from 'path';
import upload, { handleUploadError } from './middleware/upload';
import { uploadFile, getFiles, deleteFile } from './controllers/uploadController';
import { convertFiles, getConvertProgress, downloadFile } from './controllers/convertController';
import { epubUpload, epubConvert, epubDownload, epubPreview } from './controllers/epubController';

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/converted', express.static(path.join(__dirname, '../converted')));

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: 'Convert2UTF8 API 服务运行正常',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 文件上传路由
app.post('/api/upload', upload.single('file'), uploadFile);
app.get('/api/files', getFiles);
app.delete('/api/files/:fileId', deleteFile);

// 文件转换路由
app.post('/api/convert', convertFiles);
app.get('/api/convert/:taskId/progress', getConvertProgress);
app.get('/api/download/:fileId', downloadFile);

// EPUB微服务代理路由
app.post('/api/epub/upload', epubUpload);
app.post('/api/epub/convert', epubConvert);
app.get('/api/epub/download/:fileId', epubDownload);
app.get('/api/epub/preview/:fileId', epubPreview);

// 文件上传错误处理
app.use('/api/upload', handleUploadError);

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

export default app; 
