// 文件信息类型
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadTime: Date;
  status: 'uploading' | 'uploaded' | 'converting' | 'converted' | 'error';
  progress: number;
  originalEncoding?: string;
  encodingDisplayName?: string;
  convertedEncoding?: string;
  needsConversion?: boolean;
  downloadUrl?: string;
  errorMessage?: string;
  originalPath?: string;
  convertedPath?: string;
}

// 上传响应类型
export interface UploadResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  message?: string;
  error?: string;
}

// 转换请求类型
export interface ConvertRequest {
  fileIds: string[];
}

// 转换响应类型
export interface ConvertResponse {
  success: boolean;
  taskId: string;
  message?: string;
  error?: string;
}

// 转换进度类型
export interface ConvertProgress {
  taskId: string;
  totalFiles: number;
  completedFiles: number;
  currentFile?: string;
  progress: number;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

// 编码检测结果类型
export interface EncodingResult {
  encoding: string;
  confidence: number;
  isSupported: boolean;
  hasBOM: boolean;
  sampleSize: number;
  fileSize: number;
  language?: string;
  error?: string;
}

// API错误类型
export interface ApiError {
  error: string;
  message: string;
  status?: number;
}

// 文件上传配置类型
export interface UploadConfig {
  maxFileSize: number;
  allowedExtensions: string[];
  uploadDir: string;
  convertedDir: string;
} 