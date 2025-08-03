# Convert2UTF8 生产环境部署指南 (双容器架构)

## 📋 概述

本文档详细说明如何将 Convert2UTF8 项目部署到生产环境。项目采用双容器部署架构：
- 前端：React 应用 + Nginx，运行在 Docker 容器中
- 后端：Node.js API，运行在 Docker 容器中
- 代理：使用现有的 Nginx 服务器进行反向代理

## 🏗️ 系统架构

```
用户请求 → Nginx (SSL终止) → 前端容器 / 后端容器
```

### 容器架构
- **convert2utf8-frontend**: Nginx + React静态文件 (端口3000)
- **convert2utf8-backend**: Node.js API服务 (端口3001)

## 📋 前置要求

### 服务器环境
- Ubuntu/Debian 系统
- Docker 和 Docker Compose
- Nginx (已安装并配置SSL)

### 网络配置
- 现有 Docker 网络：`geotracker_baidu_map_network`
- 端口 3000 和 3001 可用

## 🚀 部署步骤

### 1. 环境准备

#### 1.1 安装 Docker (如果未安装)
```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 1.2 克隆项目
```bash
git clone https://github.com/your-repo/convert2utf8.git
cd convert2utf8
```

### 2. 一键部署

#### 2.1 执行部署脚本 (推荐)
```bash
# 给脚本执行权限
chmod +x scripts/deploy.sh

# 执行部署 (自动构建镜像并启动容器)
./scripts/deploy.sh
```

#### 2.2 超简单一键拉起
```bash
# 如果镜像已构建，直接启动容器
cd docker
docker-compose up -d --build  # --build 参数会自动构建镜像
```

#### 2.3 部署脚本功能
- 检查 Docker 环境
- 验证 Docker 网络
- 自动构建前端和后端 Docker 镜像
- 启动容器服务
- 配置 Nginx 代理
- 执行健康检查

### 3. 手动部署 (可选)

#### 3.1 一键构建和启动 (推荐)
```bash
cd docker
docker-compose up -d --build  # 自动构建镜像并启动容器
```

#### 3.2 分步构建 (可选)
```bash
# 构建前端容器
./scripts/build-frontend.sh

# 构建后端容器
./scripts/build-backend.sh

# 启动所有容器
cd docker
docker-compose up -d
```

#### 3.3 配置 Nginx
```bash
# 将 nginx/convert2utf8.conf 的内容添加到您的 default.conf 中
# 然后重载 Nginx
sudo nginx -t && sudo systemctl reload nginx
```

## ⚙️ Nginx 配置

### 需要添加到 default.conf 的配置

```nginx
# Convert2UTF8 前端容器代理
location /convert/ {
    # 移除 /convert 前缀，转发到前端容器
    rewrite ^/convert/(.*) /$1 break;
    
    # 代理头设置
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # 转发到前端容器
    proxy_pass http://convert2utf8-frontend:80/;
}

# Convert2UTF8 API代理
location /convert/api/ {
    rewrite ^/convert/api/(.*) /api/$1 break;
    
    # 代理头设置
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 文件上传大小限制
    client_max_body_size 50M;
    
    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # 转发到后端容器
    proxy_pass http://convert2utf8-backend:3001/;
}
```

## 🔧 配置说明

### Docker Compose 配置
- 使用现有的 `geotracker_baidu_map_network` 网络
- 前端容器：`convert2utf8-frontend` (端口3000)
- 后端容器：`convert2utf8-backend` (端口3001)
- 健康检查：每30秒检查一次
- **支持一键构建**：`docker-compose up -d --build`

### 环境变量
- 生产环境配置：`config/env.production`
- 开发环境配置：`config/env.example`

### 文件存储
- 上传文件：`backend/uploads/`
- 转换文件：`backend/converted/`
- 日志文件：Docker 卷 `frontend_logs` 和 `backend_logs`

## 🧪 验证部署

### 1. 检查容器状态
```bash
cd docker
docker-compose ps
```

### 2. 检查前端健康状态
```bash
curl http://localhost:3000/health
```

### 3. 检查后端API健康状态
```bash
curl http://localhost:3001/health
```

### 4. 访问应用
- 前端：https://www.beingdigital.cn/convert
- API：https://www.beingdigital.cn/convert/api/health

## 🔍 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 查看容器日志
cd docker
docker-compose logs
```

#### 2. Nginx 配置错误
```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 3. 网络连接问题
```bash
# 检查 Docker 网络
docker network ls
docker network inspect geotracker_baidu_map_network
```

#### 4. 前端容器问题
```bash
# 检查前端容器日志
docker-compose logs frontend

# 检查前端构建
docker exec convert2utf8-frontend ls -la /usr/share/nginx/html
```

#### 5. 后端容器问题
```bash
# 检查后端容器日志
docker-compose logs backend

# 检查后端应用状态
docker exec convert2utf8-backend ps aux
```

## 📊 监控和维护

### 日志查看
```bash
# 查看所有容器日志
cd docker
docker-compose logs -f

# 查看特定容器日志
docker-compose logs -f frontend
docker-compose logs -f backend
```

### 容器管理
```bash
# 重启服务
cd docker
docker-compose restart

# 停止服务
docker-compose down

# 更新服务 (重新构建镜像)
docker-compose up -d --build
```

### 备份策略
```bash
# 备份上传文件
tar -czf backup-$(date +%Y%m%d).tar.gz backend/uploads/ backend/converted/

# 备份配置文件
cp docker/docker-compose.yml backup/
cp nginx/convert2utf8.conf backup/
```

## 🔒 安全考虑

### 1. 容器安全
- 前端和后端容器都使用非 root 用户运行
- 资源限制配置
- 健康检查机制

### 2. 文件上传安全
- 限制文件类型和大小
- 文件存储路径隔离
- 定期清理临时文件

### 3. API 安全
- 添加请求频率限制
- 文件上传验证
- 错误信息脱敏

## 📞 支持

如果遇到问题，请检查：
1. 容器日志：`docker-compose logs`
2. Nginx 日志：`/var/log/nginx/error.log`
3. 前端容器：`docker-compose logs frontend`
4. 后端容器：`docker-compose logs backend`
5. 网络连接：`docker network inspect geotracker_baidu_map_network` 