import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import { UploadResponse, FileInfo, ConvertRequest, ConvertResponse } from '../types';
import { EncodingService } from '../services/encodingService';
import { ConversionService } from '../services/conversionService';
import { fileStore } from '../services/fileStore';

// 上传配置
const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedExtensions: ['.txt'],
  uploadDir: path.join(__dirname, '../../uploads'),
  convertedDir: path.join(__dirname, '../../converted'),
};

// 确保上传目录存在
fs.ensureDirSync(uploadConfig.uploadDir);
fs.ensureDirSync(uploadConfig.convertedDir);

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: '没有上传文件',
      } as UploadResponse);
      return;
    }

    const file = req.file;
    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // 验证文件类型
    if (!uploadConfig.allowedExtensions.includes(fileExtension)) {
      res.status(400).json({
        success: false,
        error: '只支持上传 .txt 文件',
      } as UploadResponse);
      return;
    }

    // 验证文件大小
    if (file.size > uploadConfig.maxFileSize) {
      res.status(400).json({
        success: false,
        error: '文件大小不能超过 5MB',
      } as UploadResponse);
      return;
    }

    // 生成唯一文件名
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(uploadConfig.uploadDir, fileName);

    // 先保存文件到磁盘
    await fs.move(file.path, filePath);

    // 检测文件编码
    const encodingResult = await EncodingService.detectEncoding(filePath);
    
    // 保存文件信息
    const fileInfo: FileInfo = {
      id: fileId,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadTime: new Date(),
      status: 'uploaded',
      progress: 100,
      originalPath: filePath,
      originalEncoding: encodingResult.encoding,
      encodingDisplayName: EncodingService.getEncodingDisplayName(encodingResult.encoding),
      needsConversion: EncodingService.needsConversion(encodingResult.encoding),
    };

    // 存储文件信息
    fileStore.addFile(fileId, fileInfo);

    const response: UploadResponse = {
      success: true,
      fileId: fileId,
      fileName: file.originalname,
      fileSize: file.size,
      message: '文件上传成功',
    };

    console.log(`文件上传成功: ${file.originalname} (${fileId})`);
    res.json(response);

  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({
      success: false,
      error: '文件上传失败',
    } as UploadResponse);
  }
};

// 获取文件列表
export const getFiles = async (req: Request, res: Response) => {
  try {
    const files = fileStore.getAllFiles();
    res.json(files);
  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.status(500).json({
      error: '获取文件列表失败',
    });
  }
};

// 删除文件
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
         const { fileId } = req.params;
     const fileInfo = fileStore.getFile(fileId);

    if (!fileInfo) {
      res.status(404).json({
        error: '文件不存在',
      });
      return;
    }

    // 删除原始文件
    if (fileInfo.originalPath && await fs.pathExists(fileInfo.originalPath)) {
      await fs.remove(fileInfo.originalPath);
    }

    // 删除转换后的文件
    if (fileInfo.convertedPath && await fs.pathExists(fileInfo.convertedPath)) {
      await fs.remove(fileInfo.convertedPath);
    }

         // 从存储中删除文件信息
     fileStore.deleteFile(fileId);

    res.json({
      success: true,
      message: '文件删除成功',
    });

  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({
      error: '删除文件失败',
    });
  }
}; 