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
  FileTextOutlined 
} from '@ant-design/icons';
import { FileInfo, ConvertProgress } from '../types';
import { convertFiles, getConvertProgress, downloadFile, deleteFile } from '../services/api';
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

      const response = await convertFiles(selectedFileIds);
      
      if (response.success) {
        message.success(`开始转换 ${selectedFileIds.length} 个文件`);
        
        // 开始轮询转换进度
        pollConversionProgress(response.taskId);
      } else {
        message.error(response.error || '转换失败');
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
      const blob = await downloadFile(file.id);
      
      console.log('下载的blob:', blob);
      
      // 验证blob是否有效
      if (!blob || !(blob instanceof Blob)) {
        throw new Error('下载的文件数据无效');
      }
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('文件下载成功');
    } catch (error) {
      console.error('下载错误:', error);
      message.error(`文件下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
      width: 150,
      render: (_: any, file: FileInfo) => (
        <Space>
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
    </div>
  );
};

export default FileList; 