import React, { useState } from 'react';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import { FileInfo } from './types';
import './App.css';

const App: React.FC = () => {
           const [files, setFiles] = useState<FileInfo[]>([]);

         // 文件上传成功处理
         const handleFileUploaded = (fileInfo: FileInfo) => {
           setFiles(prev => [...prev, fileInfo]);
         };

         // 文件上传错误处理
         const handleUploadError = (error: string) => {
           console.error('上传错误:', error);
         };

         // 文件列表变化处理
         const handleFilesChange = (updatedFiles: FileInfo[]) => {
           setFiles(updatedFiles);
         };

  return (
    <ConfigProvider locale={zhCN}>
      <div className="App">
        <header className="App-header">
          <h1>Convert2UTF8 - 文件编码转换工具</h1>
          <p>将GB2312、UTF-16等编码的TXT文件转换为UTF-8格式</p>
        </header>
        <main className="App-main">
          <div className="container">
                               <FileUpload
                     onFileUploaded={handleFileUploaded}
                     onUploadError={handleUploadError}
                   />

                   {/* 文件列表 */}
                   {files.length > 0 && (
                     <FileList
                       files={files}
                       onFilesChange={handleFilesChange}
                     />
                   )}
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
};

export default App; 
