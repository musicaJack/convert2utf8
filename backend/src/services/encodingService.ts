import * as chardet from 'chardet';
import * as fs from 'fs-extra';
import { EncodingResult } from '../types';

/**
 * 编码检测服务
 */
export class EncodingService {
  
  /**
   * 检测文件编码
   * @param filePath 文件路径
   * @returns 编码检测结果
   */
  static async detectEncoding(filePath: string): Promise<EncodingResult> {
    try {
      // 读取文件的前4KB进行编码检测
      const buffer = await fs.readFile(filePath);
      const sampleSize = Math.min(4096, buffer.length);
      const sample = buffer.slice(0, sampleSize);
      
      // 使用chardet检测编码
      const detectedEncoding = chardet.detect(sample);
      
      // 检查BOM标记
      const bomEncoding = this.detectBOM(buffer);
      
      // 优先使用BOM检测结果
      const finalEncoding = bomEncoding || detectedEncoding || 'unknown';
      
      // 验证编码是否支持
      const isSupported = this.isSupportedEncoding(finalEncoding);
      
      return {
        encoding: finalEncoding,
        confidence: detectedEncoding ? 0.8 : 0.5,
        isSupported,
        hasBOM: !!bomEncoding,
        sampleSize,
        fileSize: buffer.length
      };
      
    } catch (error) {
      console.error('编码检测失败:', error);
      return {
        encoding: 'unknown',
        confidence: 0,
        isSupported: false,
        hasBOM: false,
        sampleSize: 0,
        fileSize: 0,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
  
  /**
   * 检测BOM标记
   * @param buffer 文件缓冲区
   * @returns BOM编码或null
   */
  private static detectBOM(buffer: Buffer): string | null {
    if (buffer.length < 2) return null;
    
    // UTF-8 BOM
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      return 'utf8';
    }
    
    // UTF-16 LE BOM
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      return 'utf16le';
    }
    
    // UTF-16 BE BOM
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      return 'utf16be';
    }
    
    // UTF-32 LE BOM
    if (buffer.length >= 4 && 
        buffer[0] === 0xFF && buffer[1] === 0xFE && 
        buffer[2] === 0x00 && buffer[3] === 0x00) {
      return 'utf32le';
    }
    
    // UTF-32 BE BOM
    if (buffer.length >= 4 && 
        buffer[0] === 0x00 && buffer[1] === 0x00 && 
        buffer[2] === 0xFE && buffer[3] === 0xFF) {
      return 'utf32be';
    }
    
    return null;
  }
  
  /**
   * 检查编码是否支持
   * @param encoding 编码名称
   * @returns 是否支持
   */
  private static isSupportedEncoding(encoding: string): boolean {
    const supportedEncodings = [
      'utf8', 'utf-8',
      'utf16le', 'utf16be', 'utf-16le', 'utf-16be',
      'gb2312', 'gbk', 'gb18030',
      'big5', 'big5-hkscs',
      'shift_jis', 'euc-jp',
      'euc-kr',
      'iso-8859-1', 'iso-8859-2', 'iso-8859-5',
      'windows-1250', 'windows-1251', 'windows-1252',
      'ascii'
    ];
    
    return supportedEncodings.includes(encoding.toLowerCase());
  }
  
  /**
   * 获取编码的显示名称
   * @param encoding 编码名称
   * @returns 显示名称
   */
  static getEncodingDisplayName(encoding: string): string {
    const encodingMap: { [key: string]: string } = {
      'utf8': 'UTF-8',
      'utf-8': 'UTF-8',
      'utf16le': 'UTF-16 LE',
      'utf16be': 'UTF-16 BE',
      'utf-16le': 'UTF-16 LE',
      'utf-16be': 'UTF-16 BE',
      'gb2312': 'GB2312',
      'gbk': 'GBK',
      'gb18030': 'GB18030',
      'big5': 'Big5',
      'big5-hkscs': 'Big5-HKSCS',
      'shift_jis': 'Shift_JIS',
      'euc-jp': 'EUC-JP',
      'euc-kr': 'EUC-KR',
      'iso-8859-1': 'ISO-8859-1',
      'iso-8859-2': 'ISO-8859-2',
      'iso-8859-5': 'ISO-8859-5',
      'windows-1250': 'Windows-1250',
      'windows-1251': 'Windows-1251',
      'windows-1252': 'Windows-1252',
      'ascii': 'ASCII',
      'unknown': '未知编码'
    };
    
    return encodingMap[encoding.toLowerCase()] || encoding;
  }
  
  /**
   * 检查是否需要转换
   * @param encoding 当前编码
   * @returns 是否需要转换
   */
  static needsConversion(encoding: string): boolean {
    const targetEncoding = 'utf8';
    return encoding.toLowerCase() !== targetEncoding.toLowerCase();
  }
} 