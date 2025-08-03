# Convert2UTF8 - 文件编码转换工具

一个基于Web的文件编码转换工具，支持将GB2312、UTF-16等编码的TXT文件转换为UTF-8格式。

## 🚀 项目特性

- **文件上传**：支持拖拽上传和文件选择
- **编码检测**：自动检测文件编码格式
- **编码转换**：GB2312/UTF-16 → UTF-8
- **批量处理**：支持批量文件转换
- **实时进度**：显示转换进度
- **文件下载**：转换后文件自动下载
- **现代化UI**：基于Ant Design的美观界面
- **容器化部署**：支持Docker双容器架构部署

## 📁 项目结构

```
convert2utf8/
├── frontend/                 # React前端项目
│   ├── src/
│   │   ├── components/       # React组件
│   │   ├── services/         # API服务
│   │   ├── types/           # TypeScript类型定义
│   │   ├── utils/           # 工具函数
│   │   ├── index.tsx        # 入口文件
│   │   ├── App.tsx          # 主应用组件
│   │   ├── App.css          # 应用样式
│   │   └── index.css        # 全局样式
│   ├── public/
│   │   └── index.html       # HTML模板
│   ├── package.json         # 前端依赖配置
│   └── tsconfig.json        # TypeScript配置
├── backend/                  # Node.js后端项目
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── middleware/      # 中间件
│   │   ├── types/          # 类型定义
│   │   ├── utils/          # 工具函数
│   │   ├── app.ts          # 应用配置
│   │   └── server.ts       # 服务器入口
│   ├── uploads/            # 上传文件临时存储
│   ├── converted/          # 转换后文件存储
│   ├── package.json        # 后端依赖配置
│   ├── tsconfig.json       # TypeScript配置
│   └── nodemon.json        # 开发环境配置
├── docker/                  # Docker容器配置
│   ├── Dockerfile.frontend # 前端容器构建
│   ├── Dockerfile.backend  # 后端容器构建
│   ├── docker-compose.yml  # 容器编排配置
│   ├── nginx.conf          # 前端容器Nginx配置
│   └── .dockerignore       # Docker忽略文件
├── nginx/                   # Nginx配置模板
│   ├── convert2utf8.conf   # 生产环境Nginx配置
│   └── ssl-headers.conf    # SSL安全头配置
├── scripts/                 # 部署脚本
│   ├── deploy.sh           # 主部署脚本
│   ├── build-frontend.sh   # 前端构建脚本
│   └── build-backend.sh    # 后端构建脚本
├── config/                  # 配置文件
│   ├── env.production      # 生产环境变量
│   └── env.example         # 环境变量示例
├── docs/                    # 文档
│   ├── DEPLOYMENT.md       # 详细部署文档
│   └── README-DEPLOY.md    # 快速部署指南
├── project-manager.bat      # 项目管理工具
├── start-dev.bat           # 快速启动脚本
└── README.md               # 项目文档
```

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Ant Design** - UI组件库
- **Axios** - HTTP客户端
- **React Query** - 状态管理
- **Socket.io Client** - 实时通信

### 后端
- **Node.js** - 运行环境
- **Express** - Web框架
- **TypeScript** - 类型安全
- **Multer** - 文件上传中间件
- **iconv-lite** - 编码转换库
- **chardet** - 编码检测库
- **Socket.io** - WebSocket支持

### 部署
- **Docker** - 容器化部署
- **Docker Compose** - 容器编排
- **Nginx** - 反向代理和静态文件服务

## 🚀 快速部署

### 一键部署到生产环境
```bash
# 克隆项目
git clone https://github.com/your-repo/convert2utf8.git
cd convert2utf8

# 一键部署
./scripts/deploy.sh
```

### 本地开发
```bash
# 启动开发环境
./start-dev.bat

# 访问地址
# 前端: http://localhost:3000
# 后端: http://localhost:3001
```

### 生产环境访问
- **应用地址**: https://www.beingdigital.cn/convert/
- **API地址**: https://www.beingdigital.cn/convert/api/

## 📋 开发指南

### 项目管理工具功能

运行 `project-manager.bat` 可以看到以下功能：

1. **创建项目目录结构** - 创建完整的项目目录
2. **配置npm镜像源** - 使用阿里云镜像加速下载
3. **安装项目依赖** - 安装前端和后端依赖
4. **清理并重新安装依赖** - 清理缓存重新安装
5. **启动后端服务** - 启动Node.js后端服务
6. **启动前端服务** - 启动React前端服务
7. **启动完整开发环境** - 同时启动前后端服务
8. **查看项目状态** - 检查项目配置和端口占用
9. **退出** - 退出管理工具

### 开发环境

- **前端开发服务器**：http://localhost:3000
- **后端API服务器**：http://localhost:3001
- **前端代理配置**：自动转发API请求到后端

### 文件上传限制

- **文件类型**：仅支持 .txt 文件
- **文件大小**：单个文件不超过 5MB
- **批量上传**：最多同时上传 10 个文件

## 🔧 开发说明

### 环境要求

- **Node.js**：版本 16.0 或更高
- **npm**：版本 8.0 或更高
- **操作系统**：Windows 10/11 (开发) / Linux (生产)

### 开发流程

1. **项目初始化**：
   - 运行 `project-manager.bat` 选择选项 1
   - 运行 `project-manager.bat` 选择选项 3

2. **开发模式**：
   - 运行 `start-dev.bat` 或使用项目管理工具选项 7
   - 前端代码修改会自动热重载
   - 后端代码修改会自动重启

3. **测试功能**：
   - 访问 http://localhost:3000
   - 上传 .txt 文件测试功能
   - 查看控制台日志调试

### 构建部署

#### 开发环境构建
1. **构建前端**：
   ```bash
   cd frontend
   npm run build
   ```

2. **构建后端**：
   ```bash
   cd backend
   npm run build
   ```

3. **启动生产环境**：
   ```bash
   cd backend
   npm start
   ```

#### 生产环境部署
1. **一键部署**：
   ```bash
   ./scripts/deploy.sh
   ```

2. **手动部署**：
   ```bash
   cd docker
   docker-compose up -d --build
   ```

## 📝 API 接口

### 文件上传
- **POST** `/api/upload` - 上传文件
- **GET** `/api/files` - 获取文件列表
- **DELETE** `/api/files/:fileId` - 删除文件

### 编码转换
- **POST** `/api/convert` - 批量转换文件
- **GET** `/api/convert/:taskId/progress` - 获取转换进度
- **GET** `/api/download/:fileId` - 下载转换后的文件

### 系统状态
- **GET** `/` - API服务状态
- **GET** `/health` - 健康检查

## 🐛 常见问题

### 端口占用
如果端口3000或3001被占用，可以：
1. 使用项目管理工具选项 8 检查端口占用
2. 关闭占用端口的程序
3. 修改配置文件中的端口号

### 依赖安装失败
如果依赖安装失败，可以：
1. 使用项目管理工具选项 2 配置npm镜像源
2. 使用项目管理工具选项 4 清理重新安装
3. 检查网络连接和Node.js版本

### 文件上传失败
如果文件上传失败，请检查：
1. 文件是否为 .txt 格式
2. 文件大小是否超过 5MB
3. 后端服务是否正常运行

### 生产环境部署问题
如果生产环境部署失败，请检查：
1. Docker和Docker Compose是否安装
2. 端口3000和3001是否可用
3. Nginx配置是否正确
4. 查看容器日志：`docker-compose logs`

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 创建 Pull Request

## 📚 相关文档

- [快速部署指南](README-DEPLOY.md)
- [详细部署文档](docs/DEPLOYMENT.md)

---

**Convert2UTF8** - 让文件编码转换变得简单高效！
