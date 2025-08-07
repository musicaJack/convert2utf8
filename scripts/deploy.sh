#!/bin/bash

# Convert2UTF8 v2.0 生产环境部署脚本 (三容器架构)
# 使用方法: ./scripts/deploy.sh

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

# 检查Docker是否安装
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

# 准备挂载目录（修复：自动创建目录并设置权限，匹配容器 gid 996）
prepare_directories() {
    log_info "准备后端挂载目录..."
    
    # 定义目录路径
    UPLOAD_DIR="../backend/uploads"
    CONVERTED_DIR="../backend/converted"
    
    # 创建目录如果不存在
    mkdir -p $UPLOAD_DIR
    mkdir -p $CONVERTED_DIR
    
    # 设置权限（用户为当前用户，组为 996 匹配容器 nodejs 组）
    chown -R $(whoami):996 $UPLOAD_DIR
    chown -R $(whoami):996 $CONVERTED_DIR
    chmod -R 775 $UPLOAD_DIR
    chmod -R 775 $CONVERTED_DIR
    
    log_success "后端挂载目录准备完成（权限设置为775，组为996）"
    
    log_info "准备EPUB服务挂载目录..."
    
    # EPUB服务目录路径
    EPUB_UPLOAD_DIR="../epub-service/uploads"
    EPUB_CONVERTED_DIR="../epub-service/converted"
    
    # 创建目录如果不存在
    mkdir -p $EPUB_UPLOAD_DIR
    mkdir -p $EPUB_CONVERTED_DIR
    
    # 设置权限
    chown -R $(whoami):996 $EPUB_UPLOAD_DIR
    chown -R $(whoami):996 $EPUB_CONVERTED_DIR
    chmod -R 775 $EPUB_UPLOAD_DIR
    chmod -R 775 $EPUB_CONVERTED_DIR
    
    log_success "EPUB服务挂载目录准备完成"
}

# 一键构建和启动容器
deploy_containers() {
    log_info "一键构建和启动容器..."
    
    cd docker
    
    # 停止现有容器
    if docker-compose ps | grep -q "convert2utf8"; then
        log_info "停止现有容器..."
        docker-compose down
    fi
    
    # 一键构建并启动容器 (包含构建步骤)
    log_info "构建Docker镜像并启动容器..."
    docker-compose up -d --build
    
    # 等待容器启动
    log_info "等待容器启动..."
    sleep 15
    
    # 检查容器状态
    if docker-compose ps | grep -q "Up"; then
        log_success "容器启动成功"
    else
        log_error "容器启动失败"
        docker-compose logs
        exit 1
    fi
    
    cd ..
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 检查Nginx配置
    if sudo nginx -t; then
        log_success "Nginx配置检查通过"
    else
        log_error "Nginx配置有误，请检查配置"
        exit 1
    fi
    
    # 重载Nginx
    log_info "重载Nginx配置..."
    sudo systemctl reload nginx
    
    log_success "Nginx配置完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查容器健康状态
    if docker ps | grep -q "convert2utf8-frontend" && docker ps | grep -q "convert2utf8-backend" && docker ps | grep -q "convert2utf8-epub-service"; then
        log_success "容器运行正常"
    else
        log_error "容器未正常运行"
        exit 1
    fi
    
    # 检查前端健康端点
    echo "检查前端容器健康状态..."
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ 前端容器健康检查通过"
    else
        echo "❌ 前端容器健康检查失败"
        exit 1
    fi
    
    # 检查后端API健康端点
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "后端API健康检查通过"
    else
        log_warning "后端API健康检查失败，请手动检查"
    fi
    
    # 检查EPUB服务健康端点
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        log_success "EPUB服务健康检查通过"
    else
        log_warning "EPUB服务健康检查失败，请手动检查"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "=========================================="
    echo "Convert2UTF8 v2.0 三容器部署信息"
    echo "=========================================="
    echo "前端访问地址: https://www.beingdigital.cn/convert"
    echo "前端健康检查: http://localhost:3000/health"
    echo "后端API健康检查: http://localhost:3001/health"
    echo "EPUB服务健康检查: http://localhost:5000/health"
    echo "容器状态: docker-compose ps (在docker目录下执行)"
    echo "查看日志: docker-compose logs (在docker目录下执行)"
    echo "=========================================="
    echo ""
}

# 主函数
main() {
    echo "🚀 开始部署 Convert2UTF8 v2.0 (三容器架构)..."
    echo ""
    
    check_docker
    check_network
    prepare_directories  # 调用准备函数
    deploy_containers
    configure_nginx
    health_check
    show_deployment_info
}

# 执行主函数
main "$@"