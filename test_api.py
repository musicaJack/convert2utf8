import requests

# 测试健康检查
response = requests.get('http://localhost:5001/health')
print("健康检查:", response.json())

# 测试文件上传
with open('epub-service/data/epub/历史的温度.epub', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:5001/convert', files=files)
    result = response.json()
    print("转换结果:", result)
    
    # 从转换结果中获取file_id
    if result['success']:
        file_id = result['file_id']
        
        # 下载转换后的文件
        download_response = requests.get(f'http://localhost:5001/download/{file_id}')
        print("下载状态码:", download_response.status_code)
        print("文件大小:", len(download_response.content), "字节")
        
        # 预览文件内容
        preview_response = requests.get(f'http://localhost:5001/preview/{file_id}')
        preview_result = preview_response.json()
        print("预览结果:", preview_result['preview'][:200] + "...")