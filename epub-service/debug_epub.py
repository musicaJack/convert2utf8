#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EPUB文件调试脚本
"""

import os
import sys
sys.path.append('.')

from ebooklib import epub
from bs4 import BeautifulSoup

def debug_epub(epub_path):
    """调试EPUB文件结构"""
    print(f"🔍 调试EPUB文件: {epub_path}")
    print("=" * 60)
    
    try:
        # 读取EPUB文件
        book = epub.read_epub(epub_path)
        print("✅ EPUB文件读取成功")
        
        # 分析所有项目
        print("\n📚 文件内容分析:")
        print("-" * 40)
        
        all_items = list(book.get_items())
        print(f"总项目数: {len(all_items)}")
        
        document_count = 0
        for i, item in enumerate(all_items):
            print(f"\n项目 {i+1}:")
            print(f"  类型: {type(item)}")
            print(f"  文件名: {getattr(item, 'file_name', 'N/A')}")
            
            try:
                item_type = item.get_type()
                print(f"  项目类型: {item_type}")
                
                if hasattr(item, 'get_content'):
                    content = item.get_content()
                    if content:
                        print(f"  内容长度: {len(content)} 字节")
                        
                        # 如果是文档类型，尝试解析HTML
                        if 'document' in str(item_type).lower() or item.file_name.endswith('.xhtml'):
                            document_count += 1
                            try:
                                html_content = content.decode('utf-8')
                                soup = BeautifulSoup(html_content, 'html.parser')
                                
                                # 查找标题
                                title_elem = soup.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'title'])
                                if title_elem:
                                    print(f"  标题: {title_elem.get_text().strip()}")
                                
                                # 查找段落
                                paragraphs = soup.find_all('p')
                                print(f"  段落数: {len(paragraphs)}")
                                
                                # 显示前几个段落的内容
                                for j, p in enumerate(paragraphs[:3]):
                                    text = p.get_text().strip()
                                    if text:
                                        print(f"  段落{j+1}: {text[:100]}{'...' if len(text) > 100 else ''}")
                                
                            except Exception as e:
                                print(f"  HTML解析错误: {e}")
                    else:
                        print(f"  内容: 空")
                        
            except Exception as e:
                print(f"  获取类型错误: {e}")
        
        print(f"\n📖 文档项目数: {document_count}")
        
        # 分析元数据
        print("\n📋 元数据分析:")
        print("-" * 40)
        
        metadata_fields = ['title', 'creator', 'language', 'publisher', 'description']
        for field in metadata_fields:
            try:
                metadata = book.get_metadata('DC', field)
                if metadata:
                    print(f"{field}: {metadata[0][0]}")
                else:
                    print(f"{field}: 未找到")
            except Exception as e:
                print(f"{field}: 获取失败 - {e}")
        
        # 分析目录结构
        print("\n📑 目录结构分析:")
        print("-" * 40)
        
        if hasattr(book, 'toc') and book.toc:
            print(f"目录项数: {len(book.toc)}")
            for i, item in enumerate(book.toc[:5]):  # 只显示前5项
                print(f"  目录项{i+1}: {item}")
        else:
            print("未找到目录结构")
        
        # 分析阅读顺序
        print("\n📖 阅读顺序分析:")
        print("-" * 40)
        
        if hasattr(book, 'spine') and book.spine:
            print(f"阅读顺序项数: {len(book.spine)}")
            for i, item in enumerate(book.spine[:5]):  # 只显示前5项
                print(f"  顺序项{i+1}: {item}")
        else:
            print("未找到阅读顺序")
            
    except Exception as e:
        print(f"❌ 调试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    epub_path = "data/epub/历史的温度.epub"
    if os.path.exists(epub_path):
        debug_epub(epub_path)
    else:
        print(f"文件不存在: {epub_path}")
