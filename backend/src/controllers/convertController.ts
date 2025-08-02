import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { ConvertRequest, ConvertResponse, ConvertProgress } from '../types';
import { ConversionService } from '../services/conversionService';
import { fileStore } from '../services/fileStore';

// 转换任务存储（实际项目中应该使用数据库或Redis）
const conversionTasks = new Map<string, ConvertProgress>();

// 转换配置
const convertConfig = {
  convertedDir: path.join(__dirname, '../../converted'),
};

export const convertFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileIds }: ConvertRequest = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      res.status(400).json({
        success: false,
        error: '请选择要转换的文件',
      } as ConvertResponse);
      return;
    }

    // 验证文件是否存在
    const filesToConvert = [];
    for (const fileId of fileIds) {
      const fileInfo = fileStore.getFile(fileId);
      if (!fileInfo) {
        res.status(404).json({
          success: false,
          error: `文件不存在: ${fileId}`,
        } as ConvertResponse);
        return;
      }
      
      // 检查文件路径是否存在
      if (!fileInfo.originalPath) {
        res.status(400).json({
          success: false,
          error: `文件路径不存在: ${fileInfo.name}`,
        } as ConvertResponse);
        return;
      }
      
      filesToConvert.push({
        id: fileId,
        originalPath: fileInfo.originalPath,
        name: fileInfo.name,
      });
    }

    // 生成转换任务ID
    const taskId = uuidv4();

    // 创建转换进度对象
    const progress: ConvertProgress = {
      taskId,
      totalFiles: filesToConvert.length,
      completedFiles: 0,
      progress: 0,
      status: 'processing',
    };

    // 存储转换任务
    conversionTasks.set(taskId, progress);

    // 异步执行转换
    ConversionService.convertFiles(
      filesToConvert,
      convertConfig.convertedDir,
      (progressPercent, currentFile) => {
        const task = conversionTasks.get(taskId);
        if (task) {
          task.progress = progressPercent;
          task.currentFile = currentFile;
          task.completedFiles = Math.floor((progressPercent / 100) * task.totalFiles);
        }
      }
    ).then((result) => {
      const task = conversionTasks.get(taskId);
      if (task) {
        if (result.success) {
          task.status = 'completed';
          task.progress = 100;
          task.completedFiles = task.totalFiles;

          // 更新文件信息
          result.results.forEach((fileResult) => {
            console.log(`更新文件状态: ${fileResult.fileId}, 成功: ${fileResult.success}, 状态: ${fileResult.success ? 'converted' : 'error'}`);
            fileStore.updateFile(fileResult.fileId, {
              status: fileResult.success ? 'converted' : 'error',
              convertedPath: fileResult.convertedPath,
              originalEncoding: fileResult.originalEncoding,
              convertedEncoding: fileResult.convertedEncoding,
              errorMessage: fileResult.error,
            });
          });
        } else {
          task.status = 'error';
          task.error = result.error;
        }
      }
    }).catch((error) => {
      const task = conversionTasks.get(taskId);
      if (task) {
        task.status = 'error';
        task.error = error.message;
      }
    });

    const response: ConvertResponse = {
      success: true,
      taskId,
      message: `开始转换 ${filesToConvert.length} 个文件`,
    };

    console.log(`开始转换任务: ${taskId}, 文件数量: ${filesToConvert.length}`);
    res.json(response);

  } catch (error) {
    console.error('转换请求错误:', error);
    res.status(500).json({
      success: false,
      error: '转换请求失败',
    } as ConvertResponse);
  }
};

// 获取转换进度
export const getConvertProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;

    const progress = conversionTasks.get(taskId);
    if (!progress) {
      res.status(404).json({
        error: '转换任务不存在',
      });
      return;
    }

    res.json(progress);

  } catch (error) {
    console.error('获取转换进度错误:', error);
    res.status(500).json({
      error: '获取转换进度失败',
    });
  }
};

// 下载转换后的文件
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId } = req.params;
    console.log(`下载文件请求: ${fileId}`);

    const fileInfo = fileStore.getFile(fileId);
    if (!fileInfo) {
      console.log(`文件不存在: ${fileId}`);
      res.status(404).json({
        error: '文件不存在',
      });
      return;
    }

    console.log(`文件信息: ${fileInfo.name}, 状态: ${fileInfo.status}, 路径: ${fileInfo.convertedPath}`);

    // 检查文件是否已转换
    if (fileInfo.status !== 'converted' || !fileInfo.convertedPath) {
      console.log(`文件未转换完成: ${fileInfo.name}, 状态: ${fileInfo.status}`);
      res.status(400).json({
        error: '文件尚未转换完成',
      });
      return;
    }

    // 检查转换后的文件是否存在
    const fs = require('fs-extra');
    if (!(await fs.pathExists(fileInfo.convertedPath))) {
      console.log(`转换后的文件不存在: ${fileInfo.convertedPath}`);
      res.status(404).json({
        error: '转换后的文件不存在',
      });
      return;
    }

    console.log(`开始发送文件: ${fileInfo.convertedPath}`);

    // 设置下载头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.name)}"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    // 发送文件
    res.sendFile(fileInfo.convertedPath);

  } catch (error) {
    console.error('下载文件错误:', error);
    res.status(500).json({
      error: '下载文件失败',
    });
  }
}; 