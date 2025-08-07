#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
集成测试脚本
测试Node.js后端和EPUB微服务的集成
"""

import requests
import time
import os

# 配置
BACKEND_URL = "http://localhost:3001"
EPUB_SERVICE_URL = "http://localhost:5001"

def test_backend_health():
    """测试后端健康状态"""
    print("🔍 测试后端健康状态...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ 后端服务正常")
            return True
        else:
            print(f"❌ 后端服务异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 后端服务连接失败: {e}")
        return False

def test_epub_service_health():
    """测试EPUB微服务健康状态"""
    print("🔍 测试EPUB微服务健康状态...")
    try:
        response = requests.get(f"{EPUB_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ EPUB微服务正常")
            return True
        else:
            print(f"❌ EPUB微服务异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ EPUB微服务连接失败: {e}")
        return False

def test_epub_conversion_via_backend():
    """通过后端测试EPUB转换"""
    print("🔍 通过后端测试EPUB转换...")
    
    # 检查测试文件是否存在
    test_file_path = "epub-service/data/epub/历史的温度.epub"
    if not os.path.exists(test_file_path):
        print(f"❌ 测试文件不存在: {test_file_path}")
        return False
    
    try:
        # 上传EPUB文件到后端
        with open(test_file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(f"{BACKEND_URL}/api/epub/convert", files=files, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                file_id = result.get('file_id')
                print(f"✅ EPUB转换成功，文件ID: {file_id}")
                
                # 测试下载
                download_response = requests.get(f"{BACKEND_URL}/api/epub/download/{file_id}", timeout=30)
                if download_response.status_code == 200:
                    print(f"✅ 文件下载成功，大小: {len(download_response.content)} 字节")
                else:
                    print(f"❌ 文件下载失败: {download_response.status_code}")
                
                # 测试预览
                preview_response = requests.get(f"{BACKEND_URL}/api/epub/preview/{file_id}", timeout=30)
                if preview_response.status_code == 200:
                    preview_result = preview_response.json()
                    preview_text = preview_result.get('preview', '')
                    print(f"✅ 文件预览成功，预览长度: {len(preview_text)} 字符")
                    print(f"📖 预览内容前200字符: {preview_text[:200]}...")
                else:
                    print(f"❌ 文件预览失败: {preview_response.status_code}")
                
                return True
            else:
                print(f"❌ EPUB转换失败: {result.get('error')}")
                return False
        else:
            print(f"❌ EPUB转换请求失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ EPUB转换测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("=" * 60)
    print("Convert2UTF8 集成测试")
    print("=" * 60)
    
    # 等待服务启动
    print("⏳ 等待服务启动...")
    time.sleep(3)
    
    # 测试服务健康状态
    backend_ok = test_backend_health()
    epub_ok = test_epub_service_health()
    
    if not backend_ok or not epub_ok:
        print("\n❌ 服务健康检查失败，请检查服务是否正常启动")
        return
    
    # 测试EPUB转换集成
    conversion_ok = test_epub_conversion_via_backend()
    
    print("\n" + "=" * 60)
    print("测试结果总结:")
    print(f"后端服务: {'✅ 正常' if backend_ok else '❌ 异常'}")
    print(f"EPUB微服务: {'✅ 正常' if epub_ok else '❌ 异常'}")
    print(f"EPUB转换集成: {'✅ 正常' if conversion_ok else '❌ 异常'}")
    
    if backend_ok and epub_ok and conversion_ok:
        print("\n🎉 所有测试通过！集成成功！")
        print("\n现在可以:")
        print("1. 访问 http://localhost:3000 使用前端界面")
        print("2. 上传EPUB文件进行转换")
        print("3. 预览和下载转换后的TXT文件")
    else:
        print("\n💥 部分测试失败，请检查相关服务")
    print("=" * 60)

if __name__ == "__main__":
    main()
