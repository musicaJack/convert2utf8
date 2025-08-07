#!/bin/bash

# Convert2UTF8 v2.0 生产环境一键部署脚本
# 使用方法: ./scripts/production-deploy.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker环境
check_docker() {
    log_info "检查Docker环境..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

# 检查Docker网络
check_network() {
    log_info "检查Docker网络..."
    if ! docker network ls | grep -q "geotracker_baidu_map_network"; then
        log_warning "Docker网络 geotracker_baidu_map_network 不存在，正在创建..."
        docker network create geotracker_baidu_map_network
        log_success "Docker网络创建成功"
    else
        log_success "Docker网络已存在"
    fi
}

# 准备目录结构
prepare_directories() {
    log_info "准备目录结构..."
    
    # 创建必要的目录
    mkdir -p backend/uploads backend/converted
    mkdir -p epub-service/uploads epub-service/converted
    
    # 设置权限
    chmod 775 backend/uploads backend/converted
    chmod 775 epub-service/uploads epub-service/converted
    
    log_success "目录结构准备完成"
}

# 停止现有服务
stop_existing_services() {
    log_info "停止现有服务..."
    
    cd docker
    
    if docker-compose ps | grep -q "convert2utf8"; then
        docker-compose down
        log_success "现有服务已停止"
    else
        log_info "没有发现运行中的服务"
    fi
    
    cd ..
}

# 构建和启动服务
build_and_start() {
    log_info "构建和启动服务..."
    
    cd docker
    
    # 清理旧镜像（可选）
    log_info "清理旧镜像..."
    docker system prune -f
    
    # 构建并启动
    log_info "构建Docker镜像并启动服务..."
    docker-compose up -d --build
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    cd ..
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查容器状态
    if docker ps | grep -q "convert2utf8-frontend" && \
       docker ps | grep -q "convert2utf8-backend" && \
       docker ps | grep -q "convert2utf8-epub-service"; then
        log_success "所有容器运行正常"
    else
        log_error "部分容器未正常运行"
        docker ps | grep convert2utf8
        exit 1
    fi
    
    # 检查服务健康端点
    log_info "检查服务健康状态..."
    
    # 前端健康检查
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "前端服务健康检查通过"
    else
        log_warning "前端服务健康检查失败"
    fi
    
    # 后端健康检查
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "后端服务健康检查通过"
    else
        log_warning "后端服务健康检查失败"
    fi
    
    # EPUB服务健康检查
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        log_success "EPUB服务健康检查通过"
    else
        log_warning "EPUB服务健康检查失败"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "=========================================="
    echo "Convert2UTF8 v2.0 生产环境部署成功"
    echo "=========================================="
    echo "前端访问地址: https://www.beingdigital.cn/convert"
    echo "前端健康检查: http://localhost:3000/health"
    echo "后端API健康检查: http://localhost:3001/health"
    echo "EPUB服务健康检查: http://localhost:5000/health"
    echo ""
    echo "容器管理命令:"
    echo "  查看状态: cd docker && docker-compose ps"
    echo "  查看日志: cd docker && docker-compose logs"
    echo "  停止服务: cd docker && docker-compose down"
    echo "  重启服务: cd docker && docker-compose restart"
    echo ""
    echo "文件存储位置:"
    echo "  TXT文件: ./backend/uploads, ./backend/converted"
    echo "  EPUB文件: ./epub-service/uploads, ./epub-service/converted"
    echo "=========================================="
    echo ""
}

# 主函数
main() {
    echo "🚀 开始部署 Convert2UTF8 v2.0 到生产环境..."
    echo ""
    
    check_docker
    check_network
    prepare_directories
    stop_existing_services
    build_and_start
    health_check
    show_deployment_info
}

# 执行主函数
main "$@"
