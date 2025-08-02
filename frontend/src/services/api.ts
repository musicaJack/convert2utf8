import axios from 'axios';
import { 
  UploadResponse, 
  ConvertRequest, 
  ConvertResponse, 
  ConvertProgress,
  FileInfo,
  ApiError 
} from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API错误:', error);
    const apiError: ApiError = {
      error: '请求失败',
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
    return Promise.reject(apiError);
  }
);

// 文件上传
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response as any;
};

// 获取文件列表
export const getFiles = async (): Promise<FileInfo[]> => {
  const response = await api.get<FileInfo[]>('/files');
  return response as any;
};

// 批量转换文件
export const convertFiles = async (fileIds: string[]): Promise<ConvertResponse> => {
  const request: ConvertRequest = { fileIds };
  const response = await api.post<ConvertResponse>('/convert', request);
  return response as any;
};

// 获取转换进度
export const getConvertProgress = async (taskId: string): Promise<ConvertProgress> => {
  const response = await api.get<ConvertProgress>(`/convert/${taskId}/progress`);
  return response as any;
};

// 下载文件
export const downloadFile = async (fileId: string): Promise<Blob> => {
  const response = await api.get(`/download/${fileId}`, {
    responseType: 'blob',
  });
  return response as any;
};

// 删除文件
export const deleteFile = async (fileId: string): Promise<void> => {
  await api.delete(`/files/${fileId}`);
};

export default api; 