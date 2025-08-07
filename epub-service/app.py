from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sys
import uuid
import logging
from werkzeug.utils import secure_filename

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.epub_converter import EpubConverter
from services.text_processor import TextProcessor

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 增加到100MB
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['CONVERTED_FOLDER'] = 'converted'

# 确保目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['CONVERTED_FOLDER'], exist_ok=True)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'epub'}

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    from datetime import datetime
    return jsonify({
        'status': 'ok',
        'service': 'epub-converter',
        'timestamp': str(datetime.now())
    })

@app.route('/upload', methods=['POST'])
def upload_epub():
    """EPUB文件上传接口（只保存，不转换）"""
    try:
        # 检查是否有文件
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': '没有上传文件'
            }), 400
        
        file = request.files['file']
        
        # 检查文件名
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': '没有选择文件'
            }), 400
        
        # 检查文件类型
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': '只支持EPUB文件'
            }), 400
        
        # 生成唯一文件名
        file_id = str(uuid.uuid4())
        original_filename = file.filename  # 保留原始文件名，包括中文
        epub_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.epub")
        
        # 保存上传的文件
        file.save(epub_path)
        logger.info(f"EPUB文件已保存: {epub_path}")
        
        return jsonify({
            'success': True,
            'fileId': file_id,
            'fileName': original_filename,
            'fileSize': file.content_length or 0,
            'message': 'EPUB文件上传成功'
        })
            
    except Exception as e:
        logger.error(f"上传过程中发生错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'服务器内部错误: {str(e)}'
        }), 500

@app.route('/convert', methods=['POST'])
def convert_epub():
    """EPUB转TXT接口"""
    try:
        data = request.get_json()
        if not data or 'fileIds' not in data:
            return jsonify({
                'success': False,
                'error': '缺少文件ID列表'
            }), 400
        
        file_ids = data['fileIds']
        if not isinstance(file_ids, list) or len(file_ids) == 0:
            return jsonify({
                'success': False,
                'error': '文件ID列表不能为空'
            }), 400
        
        # 开始转换
        results = []
        for file_id in file_ids:
            epub_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}.epub")
            
            if not os.path.exists(epub_path):
                results.append({
                    'fileId': file_id,
                    'success': False,
                    'error': '文件不存在'
                })
                continue
            
            # 转换EPUB为TXT
            converter = EpubConverter()
            result = converter.convert_to_txt(epub_path, app.config['CONVERTED_FOLDER'], file_id)
            
            if result['success']:
                # 获取转换后文件的大小
                converted_path = result['converted_path']
                file_size = 0
                if os.path.exists(converted_path):
                    file_size = os.path.getsize(converted_path)
                
                results.append({
                    'fileId': file_id,
                    'success': True,
                    'fileName': f"{file_id}.txt",
                    'fileSize': file_size,
                    'message': 'EPUB转换成功'
                })
            else:
                results.append({
                    'fileId': file_id,
                    'success': False,
                    'error': result['error']
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'message': f'批量转换完成，共处理 {len(file_ids)} 个文件'
        })
            
    except Exception as e:
        logger.error(f"转换过程中发生错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'服务器内部错误: {str(e)}'
        }), 500

@app.route('/download/<file_id>', methods=['GET'])
def download_file(file_id):
    """下载转换后的文件"""
    try:
        txt_path = os.path.join(app.config['CONVERTED_FOLDER'], f"{file_id}.txt")
        
        if not os.path.exists(txt_path):
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        return send_file(
            txt_path,
            as_attachment=True,
            download_name=f"{file_id}.txt",
            mimetype='text/plain'
        )
        
    except Exception as e:
        logger.error(f"下载文件时发生错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'下载失败: {str(e)}'
        }), 500

@app.route('/preview/<file_id>', methods=['GET'])
def preview_file(file_id):
    """预览转换后的文件内容（前1000字符）"""
    try:
        txt_path = os.path.join(app.config['CONVERTED_FOLDER'], f"{file_id}.txt")
        
        if not os.path.exists(txt_path):
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read(1000)
        
        return jsonify({
            'success': True,
            'preview': content,
            'is_truncated': len(content) == 1000
        })
        
    except Exception as e:
        logger.error(f"预览文件时发生错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'预览失败: {str(e)}'
        }), 500

if __name__ == '__main__':
    from datetime import datetime
    # 生产环境应该设置为 False
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000) 