# EPUB转换服务

这是一个独立的Python微服务，用于将EPUB电子书文件转换为UTF-8编码的TXT文本文件。

## 🚀 功能特性

- **EPUB解析**: 支持标准EPUB格式文件的解析
- **文本提取**: 从HTML内容中提取纯文本
- **编码转换**: 自动检测并转换为UTF-8编码
- **章节处理**: 保留章节结构和标题
- **文本清理**: 清理HTML标签、特殊字符和格式
- **REST API**: 提供HTTP接口进行文件转换
- **文件管理**: 支持文件上传、下载和预览

## 📁 项目结构

```
epub-service/
├── app.py                 # Flask应用主入口
├── requirements.txt       # Python依赖包
├── test_converter.py      # 测试脚本
├── README.md             # 说明文档
├── services/             # 核心服务模块
│   ├── __init__.py
│   ├── epub_converter.py # EPUB转换核心逻辑
│   └── text_processor.py # 文本处理工具
├── uploads/              # 上传文件临时存储
├── converted/            # 转换后文件存储
└── test_output/          # 测试输出目录
```

## 🛠️ 安装和运行

### 1. 环境要求

- Python 3.7+
- pip

### 2. 安装依赖

```bash
cd epub-service
pip install -r requirements.txt
```

### 3. 运行服务

```bash
python app.py
```

服务将在 `http://localhost:5001` 启动

### 4. 测试转换功能

```bash
python test_converter.py <epub文件路径>
```

示例:
```bash
python test_converter.py sample.epub
```

## 📡 API接口

### 健康检查
```
GET /health
```

### EPUB转换
```
POST /convert
Content-Type: multipart/form-data

参数:
- file: EPUB文件
```

### 下载转换后的文件
```
GET /download/<file_id>
```

### 预览文件内容
```
GET /preview/<file_id>
```

## 🔧 核心组件

### EpubConverter
主要的EPUB转换类，负责：
- EPUB文件解析
- 元数据提取
- 章节内容提取
- 文本合并和编码转换

### TextProcessor
文本处理工具类，负责：
- HTML实体解码
- 文本清理和格式化
- 章节结构提取
- 字数统计和语言检测

## 📊 转换结果

转换后的TXT文件包含：
- 书籍元数据（标题、作者、出版社等）
- 章节标题和内容
- UTF-8编码的纯文本
- 清理后的格式

## 🧪 测试

运行测试脚本验证转换功能：

```bash
# 测试文本处理功能
python test_converter.py

# 测试特定EPUB文件
python test_converter.py path/to/your/book.epub
```

## 🔍 日志

服务运行时会输出详细的日志信息，包括：
- 文件上传和保存
- EPUB解析过程
- 转换进度和结果
- 错误信息

## 🚨 注意事项

1. **文件大小限制**: 默认最大50MB
2. **支持格式**: 仅支持标准EPUB格式
3. **编码处理**: 自动检测并转换为UTF-8
4. **临时文件**: 转换完成后建议清理临时文件
5. **错误处理**: 包含完整的错误处理和日志记录

## 🔗 与主项目集成

这个服务设计为独立的微服务，可以与主Node.js项目通过HTTP API进行集成：

1. Node.js后端接收EPUB文件上传
2. 转发到Python EPUB服务进行转换
3. 获取转换结果并更新文件状态
4. 提供下载和预览功能

## 📝 开发计划

- [x] 基础EPUB解析功能
- [x] 文本提取和清理
- [x] REST API接口
- [x] 测试脚本
- [ ] 批量转换支持
- [ ] 转换进度跟踪
- [ ] 更多格式支持
- [ ] 性能优化 