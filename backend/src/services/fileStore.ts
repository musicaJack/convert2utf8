import { FileInfo } from '../types';

/**
 * 文件存储服务
 * 实际项目中应该使用数据库
 */
class FileStoreService {
  private fileStore = new Map<string, FileInfo>();

  /**
   * 添加文件
   */
  addFile(fileId: string, fileInfo: FileInfo): void {
    this.fileStore.set(fileId, fileInfo);
  }

  /**
   * 获取文件
   */
  getFile(fileId: string): FileInfo | undefined {
    return this.fileStore.get(fileId);
  }

  /**
   * 获取所有文件
   */
  getAllFiles(): FileInfo[] {
    return Array.from(this.fileStore.values());
  }

  /**
   * 更新文件
   */
  updateFile(fileId: string, updates: Partial<FileInfo>): void {
    const file = this.fileStore.get(fileId);
    if (file) {
      this.fileStore.set(fileId, { ...file, ...updates });
    }
  }

  /**
   * 删除文件
   */
  deleteFile(fileId: string): boolean {
    return this.fileStore.delete(fileId);
  }

  /**
   * 检查文件是否存在
   */
  hasFile(fileId: string): boolean {
    return this.fileStore.has(fileId);
  }

  /**
   * 获取文件数量
   */
  getFileCount(): number {
    return this.fileStore.size;
  }

  /**
   * 清空所有文件
   */
  clear(): void {
    this.fileStore.clear();
  }
}

// 导出单例实例
export const fileStore = new FileStoreService(); 