import React, { useState, useCallback } from 'react';
import { Upload, message, Progress } from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import { FileInfo } from '../types';
import { uploadFile, uploadEpubFile } from '../services/api';
import './FileUpload.css';

const { Dragger } = Upload;

interface FileUploadProps {
  onFileUploaded: (fileInfo: FileInfo) => void;
  onUploadError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, onUploadError }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // 文件上传处理
  const handleUpload = useCallback(async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isTxtFile = fileName.endsWith('.txt');
    const isEpubFile = fileName.endsWith('.epub');
    
    // 验证文件类型
    if (!isTxtFile && !isEpubFile) {
      message.error('只支持上传 .txt 或 .epub 文件！');
      return false;
    }

    // 验证文件大小 (TXT: 5MB, EPUB: 100MB)
    const maxTxtSize = 5 * 1024 * 1024;
    const maxEpubSize = 100 * 1024 * 1024;
    const maxSize = isTxtFile ? maxTxtSize : maxEpubSize;
    
    if (file.size > maxSize) {
      const maxSizeMB = isTxtFile ? 5 : 100;
      message.error(`文件大小不能超过 ${maxSizeMB}MB！`);
      return false;
    }

    setUploading(true);
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 更新进度
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileId] || 0;
          if (current < 90) {
            const increment = Math.min(10, 90 - current);
            return { ...prev, [fileId]: current + increment };
          }
          return prev;
        });
      }, 100);

      // 调用上传API
      let response;
      if (isEpubFile) {
        // EPUB文件调用EPUB转换API
        response = await uploadEpubFile(file);
      } else {
        // TXT文件调用普通上传API
        response = await uploadFile(file);
      }
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

      if (response.success) {
        const fileInfo: FileInfo = {
          id: response.fileId,
          name: response.fileName,
          size: response.fileSize,
          type: isEpubFile ? 'application/epub+zip' : 'text/plain',
          uploadTime: new Date(),
          status: 'uploaded',
          progress: 100,
        };

        onFileUploaded(fileInfo);
        const successMessage = isEpubFile ? `${file.name} 上传成功！` : `${file.name} 上传成功！`;
        message.success(successMessage);
      } else {
        throw new Error(response.error || '上传失败');
      }
    } catch (error: any) {
      console.error('上传错误:', error);
      onUploadError(error.message || '上传失败，请重试');
      message.error(`${file.name} 上传失败：${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }

    return false; // 阻止默认上传行为
  }, [onFileUploaded, onUploadError]);

  // 拖拽上传配置
  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: '.txt,.epub',
    beforeUpload: handleUpload,
    showUploadList: false,
    disabled: uploading,
  };

  return (
    <div className="file-upload">
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持单个或批量上传 .txt 或 .epub 文件，TXT文件不超过 5MB，EPUB文件不超过 100MB
        </p>
        <div className="upload-icon">
          <FileTextOutlined />
        </div>
      </Dragger>

      {/* 上传进度显示 */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="upload-progress">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
                         <div key={fileId} className="progress-item">
               <div className="progress-info">
                 <span>正在上传文件...</span>
               </div>
               <Progress 
                 percent={progress} 
                 size="small" 
                 format={(percent) => `${Math.round(percent || 0)}%`}
               />
             </div>
          ))}
        </div>
      )}

      {/* 上传状态 */}
      {uploading && (
        <div className="upload-status">
          <p>正在上传文件，请稍候...</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 