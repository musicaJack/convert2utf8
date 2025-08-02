import * as iconv from 'iconv-lite';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EncodingService } from './encodingService';

/**
 * 编码转换服务
 */
export class ConversionService {
  
  /**
   * 转换文件编码
   * @param sourcePath 源文件路径
   * @param targetDir 目标目录
   * @param originalName 原始文件名
   * @returns 转换结果
   */
  static async convertFile(
    sourcePath: string, 
    targetDir: string, 
    originalName: string
  ): Promise<{
    success: boolean;
    convertedPath?: string;
    originalEncoding?: string;
    convertedEncoding?: string;
    error?: string;
  }> {
    try {
      // 检测源文件编码
      const encodingResult = await EncodingService.detectEncoding(sourcePath);
      
      if (!encodingResult.isSupported) {
        return {
          success: false,
          error: `不支持的编码格式: ${encodingResult.encoding}`
        };
      }
      
      // 如果已经是UTF-8，不需要转换
      if (!EncodingService.needsConversion(encodingResult.encoding)) {
        return {
          success: true,
          originalEncoding: encodingResult.encoding,
          convertedEncoding: 'utf8',
          convertedPath: sourcePath // 直接使用原文件
        };
      }
      
      // 读取源文件
      const sourceBuffer = await fs.readFile(sourcePath);
      
      // 解码源文件内容
      let content: string;
      try {
        content = iconv.decode(sourceBuffer, encodingResult.encoding);
      } catch (decodeError) {
        return {
          success: false,
          error: `解码失败: ${decodeError instanceof Error ? decodeError.message : '未知错误'}`
        };
      }
      
      // 编码为UTF-8
      const utf8Buffer = iconv.encode(content, 'utf8');
      
      // 生成转换后的文件路径
      const fileId = uuidv4();
      const fileExt = path.extname(originalName);
      const fileName = `${fileId}${fileExt}`;
      const convertedPath = path.join(targetDir, fileName);
      
      // 写入转换后的文件
      await fs.writeFile(convertedPath, utf8Buffer);
      
      return {
        success: true,
        convertedPath,
        originalEncoding: encodingResult.encoding,
        convertedEncoding: 'utf8'
      };
      
    } catch (error) {
      console.error('文件转换失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 批量转换文件
   * @param files 文件信息数组
   * @param targetDir 目标目录
   * @param progressCallback 进度回调
   * @returns 转换结果
   */
  static async convertFiles(
    files: Array<{ id: string; originalPath: string; name: string }>,
    targetDir: string,
    progressCallback?: (progress: number, currentFile?: string) => void
  ): Promise<{
    success: boolean;
    results: Array<{
      fileId: string;
      success: boolean;
      convertedPath?: string;
      originalEncoding?: string;
      convertedEncoding?: string;
      error?: string;
    }>;
    error?: string;
  }> {
    const results = [];
    const totalFiles = files.length;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 更新进度
        if (progressCallback) {
          progressCallback((i / totalFiles) * 100, file.name);
        }
        
        // 转换单个文件
        const result = await this.convertFile(
          file.originalPath,
          targetDir,
          file.name
        );
        
        results.push({
          fileId: file.id,
          success: result.success,
          convertedPath: result.convertedPath,
          originalEncoding: result.originalEncoding,
          convertedEncoding: result.convertedEncoding,
          error: result.error
        });
        
        // 如果转换失败，记录错误但继续处理其他文件
        if (!result.success) {
          console.error(`文件转换失败: ${file.name}`, result.error);
        }
      }
      
      // 完成进度
      if (progressCallback) {
        progressCallback(100);
      }
      
      return {
        success: true,
        results
      };
      
    } catch (error) {
      console.error('批量转换失败:', error);
      return {
        success: false,
        results,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 验证转换结果
   * @param originalPath 原始文件路径
   * @param convertedPath 转换后文件路径
   * @param originalEncoding 原始编码
   * @returns 验证结果
   */
  static async validateConversion(
    originalPath: string,
    convertedPath: string,
    originalEncoding: string
  ): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    try {
      // 读取原始文件
      const originalBuffer = await fs.readFile(originalPath);
      const originalContent = iconv.decode(originalBuffer, originalEncoding);
      
      // 读取转换后的文件
      const convertedBuffer = await fs.readFile(convertedPath);
      const convertedContent = iconv.decode(convertedBuffer, 'utf8');
      
      // 比较内容（忽略BOM差异）
      const normalizedOriginal = originalContent.replace(/^\uFEFF/, '');
      const normalizedConverted = convertedContent.replace(/^\uFEFF/, '');
      
      if (normalizedOriginal !== normalizedConverted) {
        return {
          isValid: false,
          error: '转换后内容与原始内容不匹配'
        };
      }
      
      return {
        isValid: true
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '验证失败'
      };
    }
  }
  
  /**
   * 清理临时文件
   * @param filePath 文件路径
   */
  static async cleanupFile(filePath: string): Promise<void> {
    try {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        console.log(`已清理临时文件: ${filePath}`);
      }
    } catch (error) {
      console.error(`清理文件失败: ${filePath}`, error);
    }
  }
} 