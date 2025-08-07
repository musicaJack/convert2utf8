#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EPUB转换器测试脚本
用于验证EPUB到TXT的转换功能
"""

import os
import sys
import logging
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.epub_converter import EpubConverter
from services.text_processor import TextProcessor

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_epub_conversion(epub_path, output_dir="test_output"):
    """
    测试EPUB转换功能
    
    Args:
        epub_path: EPUB文件路径
        output_dir: 输出目录
    """
    try:
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 创建转换器
        converter = EpubConverter()
        
        # 生成文件ID
        file_id = "test_" + os.path.splitext(os.path.basename(epub_path))[0]
        
        logger.info(f"开始测试转换: {epub_path}")
        
        # 获取EPUB信息
        info = converter.get_conversion_info(epub_path)
        if info['success']:
            logger.info(f"EPUB信息: {info}")
        else:
            logger.error(f"获取EPUB信息失败: {info['error']}")
            return False
        
        # 执行转换
        result = converter.convert_to_txt(epub_path, output_dir, file_id)
        
        if result['success']:
            logger.info("转换成功!")
            logger.info(f"输出文件: {result['converted_path']}")
            logger.info(f"文本长度: {result['text_length']} 字符")
            logger.info(f"章节数量: {result['chapters_count']}")
            
            # 读取转换后的文件进行验证
            txt_path = result['converted_path']
            if os.path.exists(txt_path):
                with open(txt_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 统计信息
                processor = TextProcessor()
                stats = processor.count_words(content)
                logger.info(f"文本统计: {stats}")
                
                # 显示前500字符预览
                preview = content[:500] + "..." if len(content) > 500 else content
                logger.info(f"内容预览:\n{preview}")
                
                return True
            else:
                logger.error("转换后的文件不存在")
                return False
        else:
            logger.error(f"转换失败: {result['error']}")
            return False
            
    except Exception as e:
        logger.error(f"测试过程中发生错误: {str(e)}")
        return False

def test_text_processor():
    """测试文本处理功能"""
    logger.info("测试文本处理功能...")
    
    processor = TextProcessor()
    
    # 测试HTML实体解码
    test_html = "&nbsp;Hello&nbsp;World&mdash;测试&ldquo;引号&rdquo;"
    cleaned = processor.clean_text(test_html)
    logger.info(f"HTML清理测试: {test_html} -> {cleaned}")
    
    # 测试章节结构提取
    test_text = """
    第一章 开始
    这是第一章的内容。
    
    第二章 继续
    这是第二章的内容。
    """
    chapters = processor.extract_chapter_structure(test_text)
    logger.info(f"章节提取测试: {len(chapters)} 个章节")
    for i, chapter in enumerate(chapters):
        logger.info(f"  章节 {i+1}: {chapter['title']}")
    
    # 测试字数统计
    stats = processor.count_words(test_text)
    logger.info(f"字数统计测试: {stats}")

def main():
    """主函数"""
    print("=" * 60)
    print("EPUB转换器测试程序")
    print("=" * 60)
    
    # 测试文本处理功能
    test_text_processor()
    print()
    
    # 检查命令行参数
    if len(sys.argv) < 2:
        print("使用方法: python test_converter.py <epub文件路径>")
        print("示例: python test_converter.py sample.epub")
        return
    
    epub_path = sys.argv[1]
    
    # 检查文件是否存在
    if not os.path.exists(epub_path):
        print(f"错误: 文件不存在 - {epub_path}")
        return
    
    # 检查文件扩展名
    if not epub_path.lower().endswith('.epub'):
        print("错误: 请提供EPUB文件")
        return
    
    print(f"测试文件: {epub_path}")
    print(f"文件大小: {os.path.getsize(epub_path)} 字节")
    print()
    
    # 执行转换测试
    success = test_epub_conversion(epub_path)
    
    if success:
        print("\n✅ 测试完成 - 转换成功!")
    else:
        print("\n❌ 测试失败 - 转换失败!")

if __name__ == "__main__":
    main() 