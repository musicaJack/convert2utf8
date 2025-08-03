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

## 📚 详细文档

更多详细信息请参考：[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) 