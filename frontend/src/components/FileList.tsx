import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Checkbox, 
  Progress, 
  Tag, 
  Space, 
  message, 
  Modal,
  Typography 
} from 'antd';
import { 
  DownloadOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  FileTextOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { FileInfo, ConvertProgress } from '../types';
import { convertFiles, getConvertProgress, downloadFile, deleteFile, downloadEpubFile, previewEpubFile, convertEpubFiles } from '../services/api';
import './FileList.css';

const { Text } = Typography;

interface FileListProps {
  files: FileInfo[];
  onFilesChange: (files: FileInfo[]) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onFilesChange }) => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConvertProgress | null>(null);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewFileName, setPreviewFileName] = useState<string>('');

  // 全选状态
  const allSelected = files.length > 0 && selectedFileIds.length === files.length;
  const indeterminate = selectedFileIds.length > 0 && selectedFileIds.length < files.length;

  // 处理全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFileIds(files.map(file => file.id));
    } else {
      setSelectedFileIds([]);
    }
  };

  // 处理单个选择
  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFileIds(prev => [...prev, fileId]);
    } else {
      setSelectedFileIds(prev => prev.filter(id => id !== fileId));
    }
  };

  // 开始转换
  const handleConvert = async () => {
    if (selectedFileIds.length === 0) {
      message.warning('请选择要转换的文件');
      return;
    }

    try {
      setConverting(true);
      setProgressModalVisible(true);

      // 分离TXT文件和EPUB文件
      const selectedFiles = files.filter(file => selectedFileIds.includes(file.id));
      const txtFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.txt'));
      const epubFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.epub'));

      let allSuccess = true;
      let errorMessage = '';

      // 处理TXT文件转换
      if (txtFiles.length > 0) {
        const txtFileIds = txtFiles.map(file => file.id);
        try {
          const response = await convertFiles(txtFileIds);
          if (response.success) {
            message.success(`开始转换 ${txtFileIds.length} 个TXT文件`);
            // 开始轮询转换进度
            pollConversionProgress(response.taskId);
          } else {
            allSuccess = false;
            errorMessage += `TXT文件转换失败: ${response.error}; `;
          }
        } catch (error) {
          allSuccess = false;
          errorMessage += 'TXT文件转换请求失败; ';
        }
      }

      // 处理EPUB文件转换
      if (epubFiles.length > 0) {
        const epubFileIds = epubFiles.map(file => file.id);
        try {
          const response = await convertEpubFiles(epubFileIds);
          if (response.success) {
            message.success(`EPUB文件转换完成: ${epubFileIds.length} 个文件`);
            
            // 更新文件状态
            const updatedFiles: FileInfo[] = files.map(file => {
              if (epubFileIds.includes(file.id)) {
                return { ...file, status: 'converted' as const };
              }
              return file;
            });
            onFilesChange(updatedFiles);
          } else {
            allSuccess = false;
            errorMessage += `EPUB文件转换失败: ${response.error}; `;
          }
        } catch (error) {
          allSuccess = false;
          errorMessage += 'EPUB文件转换请求失败; ';
        }
      }

      if (!allSuccess) {
        message.error(errorMessage);
        setConverting(false);
        setProgressModalVisible(false);
      }

      // 如果没有TXT文件需要轮询进度，直接完成
      if (txtFiles.length === 0) {
        setConverting(false);
        setProgressModalVisible(false);
      }

    } catch (error) {
      console.error('转换错误:', error);
      message.error('转换请求失败');
      setConverting(false);
      setProgressModalVisible(false);
    }
  };

  // 轮询转换进度
  const pollConversionProgress = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const progress = await getConvertProgress(taskId);
        setConversionProgress(progress);

        if (progress.status === 'completed') {
          message.success('转换完成！');
          setConverting(false);
          setProgressModalVisible(false);
          setConversionProgress(null);
          clearInterval(pollInterval);
          
          // 刷新文件列表 - 重新获取最新的文件信息
          try {
            const { getFiles } = await import('../services/api');
            const updatedFiles = await getFiles();
            onFilesChange(updatedFiles);
            console.log('文件列表已刷新:', updatedFiles);
          } catch (error) {
            console.error('刷新文件列表失败:', error);
          }
        } else if (progress.status === 'error') {
          message.error(`转换失败: ${progress.error}`);
          setConverting(false);
          setProgressModalVisible(false);
          setConversionProgress(null);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('获取进度失败:', error);
        clearInterval(pollInterval);
      }
    }, 1000);
  };

  // 下载文件
  const handleDownload = async (file: FileInfo) => {
    try {
      console.log('开始下载文件:', file.id, file.name);
      
      // 判断文件类型，选择不同的下载API
      const isEpubFile = file.type === 'application/epub+zip' || file.name.toLowerCase().endsWith('.epub');
      const blob = isEpubFile ? await downloadEpubFile(file.id) : await downloadFile(file.id);
      
      console.log('下载的blob:', blob);
      
      // 验证blob是否有效
      if (!blob || !(blob instanceof Blob)) {
        throw new Error('下载的文件数据无效');
      }
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // EPUB文件下载转换后的TXT文件
      if (isEpubFile) {
        const fileName = file.name.replace(/\.epub$/i, '.txt');
        link.download = fileName;
      } else {
        link.download = file.name;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      const successMessage = isEpubFile ? 'EPUB转换文件下载成功' : '文件下载成功';
      message.success(successMessage);
    } catch (error) {
      console.error('下载错误:', error);
      message.error(`文件下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 预览文件
  const handlePreview = async (file: FileInfo) => {
    try {
      const isEpubFile = file.type === 'application/epub+zip' || file.name.toLowerCase().endsWith('.epub');
      
      if (isEpubFile) {
        // EPUB文件预览转换后的内容
        const response = await previewEpubFile(file.id);
        setPreviewContent(response.preview);
        setPreviewFileName(file.name.replace(/\.epub$/i, '.txt'));
      } else {
        // TXT文件直接下载并预览
        const blob = await downloadFile(file.id);
        const text = await blob.text();
        setPreviewContent(text);
        setPreviewFileName(file.name);
      }
      
      setPreviewModalVisible(true);
    } catch (error) {
      console.error('预览错误:', error);
      message.error(`文件预览失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 删除文件
  const handleDelete = async (fileId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文件吗？删除后无法恢复。',
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteFile(fileId);
          message.success('文件删除成功');
          // 从列表中移除文件
          const updatedFiles = files.filter(file => file.id !== fileId);
          onFilesChange(updatedFiles);
          // 从选中列表中移除
          setSelectedFileIds(prev => prev.filter(id => id !== fileId));
        } catch (error) {
          console.error('删除错误:', error);
          message.error('文件删除失败');
        }
      }
    });
  };

  // 获取状态标签
  const getStatusTag = (file: FileInfo) => {
    const statusConfig = {
      uploading: { color: 'processing', text: '上传中' },
      uploaded: { color: 'success', text: '已上传' },
      converting: { color: 'processing', text: '转换中' },
      converted: { color: 'success', text: '已转换' },
      error: { color: 'error', text: '错误' }
    };

    const config = statusConfig[file.status];
    console.log(`文件 ${file.name} 状态: ${file.status}`);
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取编码标签
  const getEncodingTag = (file: FileInfo) => {
    if (file.encodingDisplayName) {
      const color = file.needsConversion ? 'orange' : 'green';
      return (
        <Tag color={color} icon={<FileTextOutlined />}>
          {file.encodingDisplayName}
        </Tag>
      );
    }
    return null;
  };

  // 表格列定义
  const columns = [
    {
      title: (
        <Checkbox
          checked={allSelected}
          indeterminate={indeterminate}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      key: 'select',
      width: 60,
      render: (_: any, file: FileInfo) => (
        <Checkbox
          checked={selectedFileIds.includes(file.id)}
          onChange={(e) => handleSelectFile(file.id, e.target.checked)}
          disabled={file.status === 'uploading' || file.status === 'converting'}
        />
      )
    },
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, file: FileInfo) => (
        <div className="file-name-cell">
          <FileTextOutlined className="file-icon" />
          <div className="file-info">
            <div className="file-name">{name}</div>
            <div className="file-meta">
              <Text type="secondary">
                {(file.size / 1024).toFixed(1)} KB
              </Text>
              {getEncodingTag(file)}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: any, file: FileInfo) => getStatusTag(file)
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, file: FileInfo) => (
        <Space>
          {(file.status === 'converted' || file.status === 'uploaded') && (
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(file)}
            >
              预览
            </Button>
          )}
          {file.status === 'converted' && (
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(file)}
            >
              下载
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(file.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="file-list">
      {/* 操作栏 */}
      <div className="file-list-header">
        <div className="file-list-info">
          <Text>
            已选择 {selectedFileIds.length} 个文件，共 {files.length} 个文件
          </Text>
        </div>
        <div className="file-list-actions">
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleConvert}
            disabled={selectedFileIds.length === 0 || converting}
            loading={converting}
          >
            转换选中文件 ({selectedFileIds.length})
          </Button>
        </div>
      </div>

      {/* 文件表格 */}
      <Table
        columns={columns}
        dataSource={files}
        rowKey="id"
        pagination={false}
        size="middle"
        className="file-table"
      />

      {/* 转换进度模态框 */}
      <Modal
        title="转换进度"
        open={progressModalVisible}
        footer={null}
        closable={!converting}
        onCancel={() => {
          if (!converting) {
            setProgressModalVisible(false);
            setConversionProgress(null);
          }
        }}
      >
        {conversionProgress && (
          <div className="conversion-progress">
            <div className="progress-info">
              <Text>
                正在转换: {conversionProgress.currentFile || '准备中...'}
              </Text>
              <Text type="secondary">
                {conversionProgress.completedFiles} / {conversionProgress.totalFiles} 个文件
              </Text>
            </div>
                         <Progress
               percent={Math.round(conversionProgress.progress)}
               format={(percent) => `${Math.round(percent || 0)}%`}
               status={conversionProgress.status === 'error' ? 'exception' : 'active'}
               strokeColor={{
                 '0%': '#108ee9',
                 '100%': '#87d068',
               }}
             />
            {conversionProgress.status === 'completed' && (
              <div className="progress-complete">
                <Text type="success">转换完成！</Text>
              </div>
            )}
            {conversionProgress.status === 'error' && (
              <div className="progress-error">
                <Text type="danger">转换失败: {conversionProgress.error}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 文件预览模态框 */}
      <Modal
        title={`文件预览 - ${previewFileName}`}
        open={previewModalVisible}
        footer={null}
        width={800}
        onCancel={() => setPreviewModalVisible(false)}
      >
        <div className="file-preview">
          <div className="preview-content">
            <pre style={{ 
              maxHeight: '500px', 
              overflow: 'auto', 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '14px',
              lineHeight: '1.6',
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}>
              {previewContent}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FileList; 