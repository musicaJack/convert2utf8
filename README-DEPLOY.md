# Convert2UTF8 快速部署指南 (双容器架构)

## 🚀 一键部署

### 生产环境部署
```bash
# 1. 克隆项目
git clone https://github.com/your-repo/convert2utf8.git
cd convert2utf8

# 2. 执行部署脚本 (自动构建镜像并启动容器)
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 超简单一键拉起 (仅容器启动)
```bash
# 如果镜像已构建，直接启动容器
cd docker
docker-compose up -d --build  # --build 参数会自动构建镜像
```

### 访问地址
- 前端：https://www.beingdigital.cn/convert
- 前端健康检查：http://localhost:3000/health
- 后端API健康检查：http://localhost:3001/health

## 📋 部署架构

- **前端容器**：Nginx + React静态文件，端口3000
- **后端容器**：Node.js API服务，端口3001
- **代理**：使用现有Nginx服务器进行反向代理
- **网络**：复用现有的`geotracker_baidu_map_network` Docker网络

## 🔄 访问规则和路由流程

### 完整访问流程图

```
用户访问 https://www.beingdigital.cn/convert/
    ↓
生产nginx (443端口)
    ↓
location /convert/ 匹配
    ↓
rewrite ^/convert/(.*) /$1 break;
    ↓
请求转发到 convert2utf8-frontend:3000
    ↓
前端容器nginx (3000端口)
    ↓
location / 匹配，返回 index.html
    ↓
浏览器解析HTML，请求静态资源
    ↓
静态资源请求 /convert/static/js/main.xxx.js
    ↓
生产nginx location /convert/ 再次匹配
    ↓
rewrite 重写为 /static/js/main.xxx.js
    ↓
前端容器返回JavaScript文件
    ↓
React应用启动，发起API请求
    ↓
API请求 /convert/api/files
    ↓
生产nginx location /convert/api/ 匹配
    ↓
rewrite ^/convert/api/(.*) /api/$1 break;
    ↓
请求转发到 convert2utf8-backend:3001
    ↓
后端Express处理 /api/files
```

### 路由规则表格

#### 1. 生产nginx路由规则

| 用户请求路径 | nginx location | 重写规则 | 转发目标 | 最终后端路径 |
|-------------|---------------|----------|----------|-------------|
| `/convert/` | `location /convert/` | `rewrite ^/convert/(.*) /$1 break;` | `convert2utf8-frontend:3000` | `/` |
| `/convert/static/js/main.xxx.js` | `location /convert/` | `rewrite ^/convert/(.*) /$1 break;` | `convert2utf8-frontend:3000` | `/static/js/main.xxx.js` |
| `/convert/static/css/main.xxx.css` | `location /convert/` | `rewrite ^/convert/(.*) /$1 break;` | `convert2utf8-frontend:3000` | `/static/css/main.xxx.css` |
| `/convert/api/upload` | `location /convert/api/` | `rewrite ^/convert/api/(.*) /api/$1 break;` | `convert2utf8-backend:3001` | `/api/upload` |
| `/convert/api/files` | `location /convert/api/` | `rewrite ^/convert/api/(.*) /api/$1 break;` | `convert2utf8-backend:3001` | `/api/files` |
| `/convert/api/convert` | `location /convert/api/` | `rewrite ^/convert/api/(.*) /api/$1 break;` | `convert2utf8-backend:3001` | `/api/convert` |

#### 2. 前端容器nginx路由规则

| 接收路径 | nginx location | 处理方式 | 返回内容 |
|---------|---------------|----------|----------|
| `/` | `location /` | `try_files $uri $uri/ /index.html;` | `index.html` |
| `/static/js/main.xxx.js` | `location ~* \.(js\|css\|png\|jpg\|jpeg\|gif\|ico\|svg\|woff\|woff2\|ttf\|eot)$` | `try_files $uri =404;` | JavaScript文件 |
| `/static/css/main.xxx.css` | `location ~* \.(js\|css\|png\|jpg\|jpeg\|gif\|ico\|svg\|woff\|woff2\|ttf\|eot)$` | `try_files $uri =404;` | CSS文件 |
| `/health` | `location /health` | `return 200 "healthy\n";` | 健康检查响应 |

#### 3. 后端Express路由规则

| 接收路径 | Express路由 | 处理函数 | 功能 |
|---------|------------|----------|------|
| `/` | `app.get('/', ...)` | 返回API服务信息 | 根路径信息 |
| `/health` | `app.get('/health', ...)` | 返回健康状态 | 健康检查 |
| `/api/upload` | `app.post('/api/upload', ...)` | `uploadFile` | 文件上传 |
| `/api/files` | `app.get('/api/files', ...)` | `getFiles` | 获取文件列表 |
| `/api/convert` | `app.post('/api/convert', ...)` | `convertFiles` | 批量转换文件 |
| `/api/convert/:taskId/progress` | `app.get('/api/convert/:taskId/progress', ...)` | `getConvertProgress` | 获取转换进度 |
| `/api/download/:fileId` | `app.get('/api/download/:fileId', ...)` | `downloadFile` | 下载文件 |
| `/api/files/:fileId` | `app.delete('/api/files/:fileId', ...)` | `deleteFile` | 删除文件 |

#### 4. 前端API请求规则

| 前端请求 | baseURL | 完整URL | 对应后端路径 |
|---------|---------|---------|-------------|
| `api.post('/upload', ...)` | `/convert/api` | `/convert/api/upload` | `/api/upload` |
| `api.get('/files')` | `/convert/api` | `/convert/api/files` | `/api/files` |
| `api.post('/convert', ...)` | `/convert/api` | `/convert/api/convert` | `/api/convert` |
| `api.get('/convert/${taskId}/progress')` | `/convert/api` | `/convert/api/convert/${taskId}/progress` | `/api/convert/${taskId}/progress` |
| `api.get('/download/${fileId}')` | `/convert/api` | `/convert/api/download/${fileId}` | `/api/download/${fileId}` |
| `api.delete('/files/${fileId}')` | `/convert/api` | `/convert/api/files/${fileId}` | `/api/files/${fileId}` |

#### 5. 配置对应关系

| 配置文件 | 关键配置 | 作用 |
|---------|---------|------|
| `frontend/package.json` | `"homepage": "/convert/"` | 构建时静态资源路径前缀 |
| `frontend/src/services/api.ts` | `baseURL: '/convert/api'` | API请求基础路径 |
| `nginx/convert2utf8.conf` | `location /convert/` | 前端页面代理规则 |
| `nginx/convert2utf8.conf` | `location /convert/api/` | API请求代理规则 |
| `docker/nginx.conf` | `location /` | 前端容器静态文件服务 |
| `backend/src/app.ts` | `app.get('/api/...')` | 后端API路由定义 |

### 关键要点总结

1. **路径重写**: 生产nginx通过rewrite规则移除`/convert/`前缀
2. **静态资源**: 前端构建时使用`/convert/`前缀，nginx重写后正确访问
3. **API代理**: 前端请求`/convert/api/*`，nginx重写为`/api/*`转发到后端
4. **容器网络**: 所有容器在同一Docker网络中，通过容器名访问
5. **SSL终止**: 生产nginx处理SSL，内部容器间使用HTTP通信

## 🔧 手动部署步骤

### 1. 一键构建和启动 (推荐)
```bash
cd docker
docker-compose up -d --build  # 自动构建镜像并启动容器
```

### 2. 分步构建 (可选)
```bash
# 构建前端容器
./scripts/build-frontend.sh

# 构建后端容器
./scripts/build-backend.sh

# 启动所有容器
cd docker
docker-compose up -d
```

### 3. 配置Nginx
将`nginx/convert2utf8.conf`的内容添加到您的`default.conf`中，然后重载Nginx。

## 📁 项目结构

```
convert2utf8/
├── docker/                 # Docker配置
│   ├── Dockerfile.frontend # 前端容器构建
│   ├── Dockerfile.backend  # 后端容器构建
│   ├── docker-compose.yml  # 容器编排 (支持一键构建)
│   ├── nginx.conf          # 前端容器Nginx配置
│   └── .dockerignore       # Docker忽略文件
├── nginx/                  # Nginx配置模板
│   ├── convert2utf8.conf   # 需要添加到现有Nginx的配置
│   └── ssl-headers.conf    # 安全头配置
├── scripts/                # 部署脚本
│   ├── deploy.sh           # 主部署脚本 (一键部署)
│   ├── build-frontend.sh   # 前端容器构建脚本
│   └── build-backend.sh    # 后端容器构建脚本
└── config/                 # 配置文件
    ├── env.production      # 生产环境变量
    └── env.example         # 环境变量示例
```

## 🧪 验证部署

```bash
# 检查容器状态
cd docker && docker-compose ps

# 检查前端健康状态
curl http://localhost:3000/health

# 检查后端API健康状态
curl http://localhost:3001/health

# 查看容器日志
docker-compose logs frontend
docker-compose logs backend
```

## 🔍 故障排除

### 查看日志
```bash
# 容器日志
cd docker && docker-compose logs

# Nginx日志
sudo tail -f /var/log/nginx/error.log
```

### 常见问题
1. **容器启动失败**：检查Docker网络和端口占用
2. **Nginx配置错误**：运行`sudo nginx -t`检查配置
3. **前端容器问题**：检查React构建是否成功
4. **后端容器问题**：检查Node.js应用是否正常启动
5. **404错误**：检查nginx的rewrite规则和proxy_pass配置
6. **静态资源加载失败**：确认前端homepage配置与nginx路径匹配
7. **API请求失败**：检查baseURL配置和nginx代理规则
8. **路径重写问题**：验证nginx的rewrite规则是否正确处理路径

## 📚 详细文档

更多详细信息请参考：[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 🔍 快速参考

### 关键配置文件
- `frontend/package.json` - 前端构建配置
- `frontend/src/services/api.ts` - API请求配置
- `nginx/convert2utf8.conf` - nginx代理配置
- `docker/nginx.conf` - 前端容器nginx配置
- `backend/src/app.ts` - 后端路由配置

### 关键路径
- 前端访问：`https://www.beingdigital.cn/convert/`
- API基础路径：`/convert/api`
- 静态资源路径：`/convert/static/`

### 容器网络
- 前端容器：`convert2utf8-frontend:3000`
- 后端容器：`convert2utf8-backend:3001`
- 网络名称：`geotracker_baidu_map_network`

### 健康检查
- 前端：`http://convert2utf8-frontend:3000/health`
- 后端：`http://convert2utf8-backend:3001/health` 