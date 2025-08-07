#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试简单EPUB文件转换
"""

import os
import sys
import logging

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.epub_converter import EpubConverter
from services.text_processor import TextProcessor

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_simple_epub():
    """测试简单EPUB文件转换"""
    epub_path = "test_book.epub"
    
    if not os.path.exists(epub_path):
        print(f"❌ 文件不存在: {epub_path}")
        return False
    
    print(f"📖 开始测试简单EPUB文件转换")
    print(f"📁 文件路径: {epub_path}")
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
        
        # 执行转换
        output_dir = "test_output"
        os.makedirs(output_dir, exist_ok=True)
        
        file_id = "test_book"
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

if __name__ == "__main__":
    print("=" * 60)
    print("简单EPUB文件转换测试")
    print("=" * 60)
    
    success = test_simple_epub()
    
    if success:
        print("\n🎉 测试完成 - 转换成功!")
    else:
        print("\n💥 测试失败 - 转换失败!")
