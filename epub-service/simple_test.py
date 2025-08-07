#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
参数化的EPUB转换测试脚本
使用方法: python simple_test.py <epub文件路径> [输出目录]
"""

import os
import sys
import argparse
import logging

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.epub_converter import EpubConverter
from services.text_processor import TextProcessor

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_epub_conversion(epub_path, output_dir="test_output"):
    """测试EPUB文件转换"""
    
    if not os.path.exists(epub_path):
        print(f"❌ 文件不存在: {epub_path}")
        return False
    
    # 从文件路径中提取文件名（不含扩展名）作为file_id
    file_name = os.path.basename(epub_path)
    file_id = os.path.splitext(file_name)[0]
    
    print(f"📖 开始测试EPUB转换")
    print(f"📁 源文件: {epub_path}")
    print(f"📁 输出目录: {output_dir}")
    print(f"📊 文件大小: {os.path.getsize(epub_path)} 字节")
    print()
    
    try:
        # 创建转换器
        converter = EpubConverter()
        
        # 获取EPUB信息
        print("🔍 获取EPUB信息...")
        info = converter.get_conversion_info(epub_path)
        
        if info['success']:
            print(f"✅ EPUB信息获取成功:")
            print(f"   标题: {info['metadata']['title']}")
            print(f"   作者: {info['metadata']['author']}")
            print(f"   语言: {info['metadata']['language']}")
            print(f"   章节数: {info['chapter_count']}")
            print(f"   文件大小: {info['file_size']} 字节")
        else:
            print(f"❌ 获取EPUB信息失败: {info['error']}")
            return False
        
        print()
        print("🔄 开始转换...")
        
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 执行转换
        result = converter.convert_to_txt(epub_path, output_dir, file_id)
        
        if result['success']:
            print("✅ 转换成功!")
            print(f"📄 输出文件: {result['converted_path']}")
            print(f"📝 文本长度: {result['text_length']} 字符")
            print(f"📚 章节数量: {result['chapters_count']}")
            
            # 读取转换后的文件进行验证
            txt_path = result['converted_path']
            if os.path.exists(txt_path):
                with open(txt_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 统计信息
                processor = TextProcessor()
                stats = processor.count_words(content)
                print(f"📊 文本统计: {stats}")
                
                # 显示前1000字符预览
                preview = content[:1000] + "..." if len(content) > 1000 else content
                print(f"👀 内容预览:\n{preview}")
                
                return True
            else:
                print("❌ 转换后的文件不存在")
                return False
        else:
            print(f"❌ 转换失败: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='EPUB转TXT测试工具')
    parser.add_argument('epub_path', help='EPUB文件路径')
    parser.add_argument('-o', '--output', default='test_output', 
                       help='输出目录 (默认: test_output)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='显示详细日志')
    
    args = parser.parse_args()
    
    # 设置日志级别
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    print("=" * 60)
    print("EPUB转TXT测试工具")
    print("=" * 60)
    
    success = test_epub_conversion(args.epub_path, args.output)
    
    if success:
        print("\n🎉 测试完成 - 转换成功!")
    else:
        print("\n💥 测试失败 - 转换失败!")

if __name__ == "__main__":
    main()
