#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EPUB转换器快速测试脚本
自动创建测试文件并验证转换功能
"""

import os
import sys
import time
from create_test_epub import create_test_epub
from test_converter import test_epub_conversion

def quick_test():
    """快速测试整个转换流程"""
    print("=" * 60)
    print("EPUB转换器快速测试")
    print("=" * 60)
    
    # 1. 创建测试EPUB文件
    print("\n1. 创建测试EPUB文件...")
    epub_path = create_test_epub("quick_test_book.epub")
    
    if not os.path.exists(epub_path):
        print("❌ 测试EPUB文件创建失败")
        return False
    
    print(f"✅ 测试EPUB文件创建成功: {epub_path}")
    
    # 2. 测试转换功能
    print("\n2. 测试EPUB转换功能...")
    success = test_epub_conversion(epub_path, "quick_test_output")
    
    if success:
        print("✅ EPUB转换测试成功")
        
        # 3. 检查输出文件
        txt_path = os.path.join("quick_test_output", "test_quick_test_book.txt")
        if os.path.exists(txt_path):
            with open(txt_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"✅ 转换后的TXT文件: {txt_path}")
            print(f"   文件大小: {len(content)} 字符")
            print(f"   内容预览: {content[:200]}...")
        else:
            print("❌ 转换后的TXT文件不存在")
            return False
    else:
        print("❌ EPUB转换测试失败")
        return False
    
    # 4. 清理测试文件
    print("\n3. 清理测试文件...")
    try:
        if os.path.exists(epub_path):
            os.remove(epub_path)
            print(f"✅ 已删除测试EPUB文件: {epub_path}")
        
        import shutil
        if os.path.exists("quick_test_output"):
            shutil.rmtree("quick_test_output")
            print("✅ 已删除测试输出目录")
    except Exception as e:
        print(f"⚠️  清理文件时出错: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 快速测试完成 - 所有功能正常!")
    print("=" * 60)
    
    return True

def main():
    """主函数"""
    try:
        success = quick_test()
        if success:
            print("\n✅ 测试通过 - 可以开始使用EPUB转换功能!")
            print("\n下一步:")
            print("1. 启动服务: python app.py")
            print("2. 或者测试真实EPUB文件: python test_converter.py <epub文件路径>")
        else:
            print("\n❌ 测试失败 - 请检查错误信息")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 