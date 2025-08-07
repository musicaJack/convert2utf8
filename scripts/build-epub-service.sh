#!/bin/bash

# Convert2UTF8 EPUB服务构建脚本
# 使用方法: ./scripts/build-epub-service.sh

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

# 检查Python环境
check_python() {
    log_info "检查Python环境..."
    if ! command -v python3 &> /dev/null; then
        log_error "Python3未安装，请先安装Python3"
        exit 1
    fi
    
    if ! command -v pip3 &> /dev/null; then
        log_error "pip3未安装，请先安装pip3"
        exit 1
    fi
    
    log_success "Python环境检查通过"
}

# 安装依赖
install_dependencies() {
    log_info "安装EPUB服务依赖..."
    
    cd epub-service
    
    # 创建虚拟环境（如果不存在）
    if [ ! -d "venv" ]; then
        log_info "创建Python虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 升级pip
    pip install --upgrade pip
    
    # 安装依赖
    pip install -r requirements.txt
    
    log_success "EPUB服务依赖安装完成"
    
    cd ..
}

# 测试EPUB服务
test_epub_service() {
    log_info "测试EPUB服务..."
    
    cd epub-service
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 运行测试
    if python test_converter.py; then
        log_success "EPUB服务测试通过"
    else
        log_warning "EPUB服务测试失败，但继续构建"
    fi
    
    cd ..
}

# 构建Docker镜像
build_docker_image() {
    log_info "构建EPUB服务Docker镜像..."
    
    cd docker
    
    # 构建镜像
    docker build -f Dockerfile.epub-service -t convert2utf8-epub-service:latest ../epub-service
    
    if [ $? -eq 0 ]; then
        log_success "EPUB服务Docker镜像构建成功"
    else
        log_error "EPUB服务Docker镜像构建失败"
        exit 1
    fi
    
    cd ..
}

# 主函数
main() {
    echo "🔧 开始构建 Convert2UTF8 EPUB服务..."
    echo ""
    
    check_python
    install_dependencies
    test_epub_service
    build_docker_image
    
    log_success "EPUB服务构建完成！"
    echo ""
    echo "=========================================="
    echo "EPUB服务构建信息"
    echo "=========================================="
    echo "Docker镜像: convert2utf8-epub-service:latest"
    echo "测试文件: epub-service/test_converter.py"
    echo "服务端口: 5000"
    echo "=========================================="
    echo ""
}

# 执行主函数
main "$@"
