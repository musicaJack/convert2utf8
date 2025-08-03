#!/bin/bash

# 后端Docker构建脚本
# 使用方法: ./scripts/build-backend.sh

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

log_info "开始构建后端Docker镜像..."

# 进入docker目录
cd docker

# 检查网络
if ! docker network ls | grep -q "geotracker_baidu_map_network"; then
    log_warning "Docker网络不存在，正在创建..."
    docker network create geotracker_baidu_map_network
fi

# 停止现有容器
if docker-compose ps | grep -q "convert2utf8-backend"; then
    log_info "停止现有容器..."
    docker-compose down
fi

# 准备挂载目录（修复：自动创建目录并设置权限）
prepare_directories() {
    log_info "准备后端挂载目录..."
    
    # 定义目录路径
    UPLOAD_DIR="../backend/uploads"
    CONVERTED_DIR="../backend/converted"
    
    # 创建目录如果不存在
    mkdir -p $UPLOAD_DIR
    mkdir -p $CONVERTED_DIR
    
    # 设置权限（假设用户为 lighthouse 和 docker 组，调整为您的实际用户/组）
    chown -R lighthouse:docker $UPLOAD_DIR
    chown -R lighthouse:docker $CONVERTED_DIR
    chmod -R 775 $UPLOAD_DIR
    chmod -R 775 $CONVERTED_DIR
    
    log_success "挂载目录准备完成（权限设置为775）"
}

prepare_directories  # 新增：准备目录和权限

# 构建镜像
log_info "构建Docker镜像..."
docker-compose build --no-cache

# 检查构建结果
if docker images | grep -q "convert2utf8-backend"; then
    log_success "Docker镜像构建完成"
else
    echo "错误: Docker镜像构建失败"
    exit 1
fi

# 启动容器进行测试
log_info "启动容器进行测试..."
docker-compose up -d

# 等待容器启动
sleep 10

# 检查容器状态
if docker-compose ps | grep -q "Up"; then
    log_success "容器启动成功"
    
    # 健康检查
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "API健康检查通过"
    else
        log_warning "API健康检查失败，请检查容器日志"
        docker-compose logs
    fi
else
    echo "错误: 容器启动失败"
    docker-compose logs
    exit 1
fi

cd ..

log_success "后端Docker构建脚本执行完成" 