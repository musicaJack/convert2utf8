#!/bin/bash

# 前端Docker构建脚本
# 使用方法: ./scripts/build-frontend.sh

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装"
    exit 1
fi

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装"
    exit 1
fi

log_info "开始构建前端Docker镜像..."

# 进入docker目录
cd docker

# 检查网络
if ! docker network ls | grep -q "geotracker_baidu_map_network"; then
    log_warning "Docker网络不存在，正在创建..."
    docker network create geotracker_baidu_map_network
fi

# 停止现有前端容器
if docker-compose ps | grep -q "convert2utf8-frontend"; then
    log_info "停止现有前端容器..."
    docker-compose stop frontend
fi

# 构建前端镜像
log_info "构建前端Docker镜像..."
docker-compose build --no-cache frontend

# 检查构建结果
if docker images | grep -q "convert2utf8_frontend"; then
    log_success "前端Docker镜像构建完成"
else
    echo "错误: 前端Docker镜像构建失败"
    exit 1
fi

# 启动前端容器进行测试
log_info "启动前端容器进行测试..."
docker-compose up -d frontend

# 等待容器启动
sleep 10

# 检查容器状态
if docker-compose ps | grep -q "convert2utf8-frontend.*Up"; then
    log_success "前端容器启动成功"
    
    # 健康检查
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "前端健康检查通过"
    else
        log_warning "前端健康检查失败，请检查容器日志"
        docker-compose logs frontend
    fi
else
    echo "错误: 前端容器启动失败"
    docker-compose logs frontend
    exit 1
fi

cd ..

log_success "前端Docker构建脚本执行完成" 