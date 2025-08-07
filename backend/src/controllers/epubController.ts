import { Request, Response } from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';

// EPUB微服务配置
const EPUB_SERVICE_URL = process.env.EPUB_SERVICE_URL || 'http://localhost:5001';

// 配置multer用于处理文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/**
 * EPUB文件上传接口（只保存，不转换）
 */
export const epubUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    // 使用multer处理文件上传
    upload.single('file')(req, res, async (err) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: '文件上传失败: ' + err.message
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: '没有上传文件'
        });
        return;
      }

      // 检查文件类型
      if (!req.file.originalname.toLowerCase().endsWith('.epub')) {
        res.status(400).json({
          success: false,
          error: '只支持EPUB文件'
        });
        return;
      }

      try {
        // 创建FormData
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        });

        // 调用EPUB微服务上传接口
        const response = await axios.post(`${EPUB_SERVICE_URL}/upload`, formData, {
          headers: {
            ...formData.getHeaders(),
            'Content-Length': formData.getLengthSync()
          },
          timeout: 60000 // 1分钟超时
        });

        // 返回EPUB微服务的响应
        res.json(response.data);

      } catch (error: any) {
        console.error('EPUB微服务调用失败:', error);
        
        if (error.response) {
          // EPUB微服务返回了错误响应
          res.status(error.response.status).json(error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
          res.status(503).json({
            success: false,
            error: 'EPUB微服务不可用，请检查服务是否启动'
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'EPUB上传失败: ' + (error.message || '未知错误')
          });
        }
      }
    });

  } catch (error: any) {
    console.error('EPUB上传控制器错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};

/**
 * EPUB转TXT转换接口
 */
export const epubConvert = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileIds } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      res.status(400).json({
        success: false,
        error: '缺少文件ID列表或列表为空'
      });
      return;
    }

    try {
      // 调用EPUB微服务转换接口
      const response = await axios.post(`${EPUB_SERVICE_URL}/convert`, {
        fileIds: fileIds
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5分钟超时
      });

      // 返回EPUB微服务的响应
      res.json(response.data);

    } catch (error: any) {
      console.error('EPUB微服务调用失败:', error);
      
      if (error.response) {
        // EPUB微服务返回了错误响应
        res.status(error.response.status).json(error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          success: false,
          error: 'EPUB微服务不可用，请检查服务是否启动'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'EPUB转换失败: ' + (error.message || '未知错误')
        });
      }
    }

  } catch (error: any) {
    console.error('EPUB转换控制器错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};

/**
 * 下载转换后的EPUB文件
 */
export const epubDownload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      res.status(400).json({
        success: false,
        error: '缺少文件ID'
      });
      return;
    }

    // 调用EPUB微服务下载接口
    const response = await axios.get(`${EPUB_SERVICE_URL}/download/${fileId}`, {
      responseType: 'stream',
      timeout: 60000 // 1分钟超时
    });

    // 设置响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileId}.txt"`);

    // 流式传输文件
    response.data.pipe(res);

  } catch (error: any) {
    console.error('EPUB下载失败:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: 'EPUB微服务不可用'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '下载失败: ' + (error.message || '未知错误')
      });
    }
  }
};

/**
 * 预览转换后的EPUB文件内容
 */
export const epubPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      res.status(400).json({
        success: false,
        error: '缺少文件ID'
      });
      return;
    }

    // 调用EPUB微服务预览接口
    const response = await axios.get(`${EPUB_SERVICE_URL}/preview/${fileId}`, {
      timeout: 30000 // 30秒超时
    });

    // 返回预览结果
    res.json(response.data);

  } catch (error: any) {
    console.error('EPUB预览失败:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: 'EPUB微服务不可用'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '预览失败: ' + (error.message || '未知错误')
      });
    }
  }
};
