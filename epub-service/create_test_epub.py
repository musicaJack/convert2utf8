#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建测试用EPUB文件
用于测试EPUB转换功能
"""

import os
from ebooklib import epub

def create_test_epub(output_path="test_book.epub"):
    """创建一个测试用的EPUB文件"""
    
    # 创建EPUB书籍
    book = epub.EpubBook()
    
    # 设置元数据
    book.set_identifier('test-book-001')
    book.set_title('测试电子书')
    book.set_language('zh-CN')
    book.add_author('测试作者')
    book.add_metadata('DC', 'publisher', '测试出版社')
    book.add_metadata('DC', 'description', '这是一个用于测试EPUB转换功能的电子书')
    
    # 创建章节内容
    chapters = [
        {
            'title': '第一章 开始',
            'content': '''
            <h1>第一章 开始</h1>
            <p>这是第一章的内容。今天天气很好，阳光明媚。</p>
            <p>主人公小明走在街上，心情愉快。他想着今天要做的事情。</p>
            <p>"今天是个好日子！"小明自言自语道。</p>
            '''
        },
        {
            'title': '第二章 发展',
            'content': '''
            <h1>第二章 发展</h1>
            <p>故事继续发展。小明遇到了他的朋友小红。</p>
            <p>"你好，小红！"小明打招呼道。</p>
            <p>"你好，小明！今天天气真不错。"小红回答道。</p>
            <p>他们一起走在街上，聊着天。</p>
            '''
        },
        {
            'title': '第三章 高潮',
            'content': '''
            <h1>第三章 高潮</h1>
            <p>故事达到高潮。突然，天空开始下雨。</p>
            <p>"糟糕，我们没有带伞！"小红担心地说。</p>
            <p>"没关系，我们可以找个地方躲雨。"小明安慰道。</p>
            <p>他们跑进了一家咖啡店。</p>
            '''
        },
        {
            'title': '第四章 结局',
            'content': '''
            <h1>第四章 结局</h1>
            <p>故事接近尾声。雨停了，太阳重新出现。</p>
            <p>"雨停了，我们继续走吧。"小明说。</p>
            <p>"好的，今天真是美好的一天。"小红笑着说。</p>
            <p>他们继续他们的旅程，故事到此结束。</p>
            '''
        }
    ]
    
    # 创建章节
    epub_chapters = []
    for i, chapter_data in enumerate(chapters):
        chapter = epub.EpubHtml(
            title=chapter_data['title'],
            file_name=f'chapter_{i+1}.xhtml',
            content=chapter_data['content']
        )
        book.add_item(chapter)
        epub_chapters.append(chapter)
    
    # 创建目录
    book.toc = epub_chapters
    
    # 添加默认NCX和Nav文件
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())
    
    # 定义阅读顺序
    book.spine = ['nav'] + epub_chapters
    
    # 写入EPUB文件
    epub.write_epub(output_path, book)
    
    print(f"测试EPUB文件已创建: {output_path}")
    print(f"文件大小: {os.path.getsize(output_path)} 字节")
    
    return output_path

def main():
    """主函数"""
    print("=" * 50)
    print("创建测试用EPUB文件")
    print("=" * 50)
    
    # 创建测试EPUB文件
    epub_path = create_test_epub()
    
    print("\n测试文件信息:")
    print(f"- 文件路径: {epub_path}")
    print(f"- 文件大小: {os.path.getsize(epub_path)} 字节")
    print(f"- 章节数量: 4")
    print(f"- 语言: 中文")
    
    print("\n现在可以使用以下命令测试转换功能:")
    print(f"python test_converter.py {epub_path}")
    
    print("\n或者启动服务进行API测试:")
    print("python app.py")

if __name__ == "__main__":
    main() 