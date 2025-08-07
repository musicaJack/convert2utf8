#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单服务测试脚本
"""

import requests
import time

def test_service(url, name):
    """测试服务是否启动"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"✅ {name} 正常 (状态码: {response.status_code})")
            return True
        else:
            print(f"❌ {name} 异常 (状态码: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ {name} 连接失败: {e}")
        return False

def main():
    print("=" * 50)
    print("服务状态检查")
    print("=" * 50)
    
    services = [
        ("http://localhost:3001/health", "后端服务"),
        ("http://localhost:5001/health", "EPUB微服务"),
    ]
    
    all_ok = True
    for url, name in services:
        if not test_service(url, name):
            all_ok = False
    
    print("\n" + "=" * 50)
    if all_ok:
        print("🎉 所有服务正常运行！")
        print("现在可以访问 http://localhost:3000 使用前端界面")
    else:
        print("💥 部分服务未启动，请检查相关服务")
    print("=" * 50)

if __name__ == "__main__":
    main()
