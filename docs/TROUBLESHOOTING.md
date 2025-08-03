# Convert2UTF8 故障排除指南

## 🔍 常见问题及解决方案

### 开发环境问题

#### 1. 端口占用问题

**问题描述**：启动服务时提示端口被占用

**解决方案**：
```bash
# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# 使用项目管理工具检查
project-manager.bat
# 选择选项 8 查看项目状态

# 关闭占用端口的进程
taskkill /PID <进程ID> /F
```

#### 2. 依赖安装失败

**问题描述**：npm install 失败或很慢

**解决方案**：
```bash
# 使用项目管理工具配置镜像源
project-manager.bat
# 选择选项 2 配置npm镜像源

# 清理并重新安装
project-manager.bat
# 选择选项 4 清理并重新安装依赖

# 手动清理
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 3. Node.js版本问题

**问题描述**：提示Node.js版本过低

**解决方案**：
```bash
# 检查Node.js版本
node --version
npm --version

# 安装Node.js 16+版本
# 下载地址：https://nodejs.org/
```

#### 4. 前端热重载不工作

**问题描述**：前端代码修改后页面不自动刷新

**解决方案**：
```bash
# 重启前端服务
cd frontend
npm start

# 检查package.json中的scripts配置
# 确保包含 "start": "react-scripts start"
```

#### 5. 后端自动重启不工作

**问题描述**：后端代码修改后服务不自动重启

**解决方案**：
```bash
# 检查nodemon配置
cat backend/nodemon.json

# 重启后端服务
cd backend
npm run dev

# 手动重启
pkill -f "node.*server"
npm run dev
```

### 生产环境问题

#### 1. Docker容器启动失败

**问题描述**：docker-compose up 失败

**解决方案**：
```bash
# 查看详细错误信息
cd docker
docker-compose logs

# 检查Docker网络
docker network ls
docker network inspect geotracker_baidu_map_network

# 重新构建镜像
docker-compose build --no-cache

# 清理Docker资源
docker system prune -f
```

#### 2. 前端容器构建失败

**问题描述**：前端Docker镜像构建失败

**解决方案**：
```bash
# 检查前端代码
cd frontend
npm run build

# 检查Dockerfile配置
cat docker/Dockerfile.frontend

# 手动构建前端镜像
cd docker
docker build -f Dockerfile.frontend -t convert2utf8-frontend ../frontend
```

#### 3. 后端容器启动失败

**问题描述**：后端容器启动后立即退出

**解决方案**：
```bash
# 查看容器日志
docker-compose logs backend

# 检查环境变量
docker exec convert2utf8-backend env

# 检查文件权限
docker exec convert2utf8-backend ls -la /app

# 手动进入容器调试
docker run -it convert2utf8-backend /bin/sh
```

#### 4. Nginx配置错误

**问题描述**：Nginx配置检查失败

**解决方案**：
```bash
# 检查Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 检查配置文件语法
sudo nginx -T | grep convert2utf8
```

#### 5. 网络连接问题

**问题描述**：容器间无法通信

**解决方案**：
```bash
# 检查Docker网络
docker network ls
docker network inspect geotracker_baidu_map_network

# 检查容器网络配置
docker inspect convert2utf8-frontend | grep NetworkMode
docker inspect convert2utf8-backend | grep NetworkMode

# 重新创建网络
docker network rm geotracker_baidu_map_network
docker network create geotracker_baidu_map_network
```

### 应用功能问题

#### 1. 文件上传失败

**问题描述**：文件上传时出现错误

**解决方案**：
```bash
# 检查文件类型和大小
# 确保文件是.txt格式且小于5MB

# 检查后端日志
docker-compose logs backend

# 检查上传目录权限
docker exec convert2utf8-backend ls -la /app/uploads
```

#### 2. 编码检测不准确

**问题描述**：文件编码检测结果不准确

**解决方案**：
```bash
# 检查chardet库版本
docker exec convert2utf8-backend npm list chardet

# 查看检测日志
docker-compose logs backend | grep "encoding detected"

# 手动测试编码检测
docker exec convert2utf8-backend node -e "
const chardet = require('chardet');
const fs = require('fs');
const buffer = fs.readFileSync('/app/uploads/test.txt');
console.log('Detected encoding:', chardet.detect(buffer));
"
```

#### 3. 转换进度不更新

**问题描述**：文件转换进度不实时更新

**解决方案**：
```bash
# 检查Socket.io连接
docker-compose logs backend | grep socket

# 检查前端WebSocket连接
# 打开浏览器开发者工具查看Network标签

# 重启Socket.io服务
docker-compose restart backend
```

#### 4. 文件下载失败

**问题描述**：转换后的文件无法下载

**解决方案**：
```bash
# 检查转换目录
docker exec convert2utf8-backend ls -la /app/converted

# 检查文件权限
docker exec convert2utf8-backend chmod 644 /app/converted/*

# 检查Nginx代理配置
curl -I http://localhost:3001/api/download/test-file-id
```

### 性能问题

#### 1. 大文件处理慢

**问题描述**：大文件转换速度慢

**解决方案**：
```bash
# 增加容器资源限制
# 在docker-compose.yml中添加：
# deploy:
#   resources:
#     limits:
#       memory: 2G
#       cpus: '2'

# 优化Node.js内存
# 在Dockerfile.backend中添加：
# ENV NODE_OPTIONS="--max-old-space-size=2048"
```

#### 2. 内存使用过高

**问题描述**：容器内存使用过高

**解决方案**：
```bash
# 监控容器资源使用
docker stats

# 设置内存限制
docker-compose down
# 修改docker-compose.yml添加资源限制
docker-compose up -d

# 优化Node.js垃圾回收
# 在环境变量中添加：
# NODE_OPTIONS="--max-old-space-size=1024 --gc-interval=100"
```

### 安全问题

#### 1. 文件上传安全

**问题描述**：担心文件上传安全

**解决方案**：
```bash
# 检查文件类型验证
docker exec convert2utf8-backend cat /app/src/middleware/upload.ts

# 添加文件扫描
# 在upload中间件中添加文件内容检查

# 限制文件大小
# 在nginx配置中设置client_max_body_size
```

#### 2. API访问控制

**问题描述**：需要添加API访问控制

**解决方案**：
```bash
# 添加API密钥验证
# 在app.ts中添加认证中间件

# 添加请求频率限制
# 安装express-rate-limit并配置

# 添加CORS配置
# 在生产环境配置中限制允许的域名
```

## 📞 获取帮助

如果以上解决方案无法解决您的问题，请：

1. **查看详细日志**：
   ```bash
   # 开发环境
   npm run dev 2>&1 | tee debug.log
   
   # 生产环境
   docker-compose logs > debug.log
   ```

2. **收集系统信息**：
   ```bash
   # 系统信息
   uname -a
   docker --version
   docker-compose --version
   
   # 项目信息
   git log --oneline -5
   cat package.json | grep version
   ```

3. **提交Issue**：
   - 包含详细的错误信息
   - 提供复现步骤
   - 附上系统环境信息

## 🔧 调试工具

### 开发环境调试
```bash
# 前端调试
cd frontend
npm start
# 打开浏览器开发者工具

# 后端调试
cd backend
npm run dev
# 查看控制台输出
```

### 生产环境调试
```bash
# 容器调试
docker-compose exec backend /bin/sh
docker-compose exec frontend /bin/sh

# 日志监控
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# 性能监控
docker stats
docker exec convert2utf8-backend top
```

---

**提示**：在提交Issue时，请尽可能提供详细的错误信息和复现步骤，这样能更快地解决问题。 