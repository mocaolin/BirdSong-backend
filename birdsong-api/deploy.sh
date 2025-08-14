#!/bin/bash

# BirdSong API 一键部署脚本
# 该脚本将自动完成 Docker 环境下的完整部署流程

set -e  # 遇到错误时终止脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查是否以 root 权限运行
check_root() {
    if [[ $EUID -eq 0 ]]; then
        warn "检测到正在以 root 用户运行脚本，这在某些环境中可能不安全"
        read -p "是否继续以 root 用户运行? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "请使用非 root 用户运行此脚本"
            exit 1
        fi
    fi
}

# 检查依赖
check_dependencies() {
    log "检查依赖..."
    
    if ! command_exists docker; then
        error "未找到 Docker，请先安装 Docker"
        exit 1
    fi
    
    # 检查 docker-compose 命令是否存在
    if command_exists docker-compose; then
        DOCKER_COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        error "未找到 docker-compose，请先安装 docker-compose"
        exit 1
    fi
    
    log "使用 Docker Compose 命令: $DOCKER_COMPOSE_CMD"
    
    if ! command_exists git; then
        error "未找到 git，请先安装 git"
        exit 1
    fi
    
    log "所有依赖检查通过"
}

# 克隆或更新代码库
setup_repository() {
    if [ -d ".git" ]; then
        log "更新代码库..."
        git pull
    else
        log "克隆代码库..."
        # 注意：这里使用占位符，实际使用时需要替换为真实仓库地址
        git clone <REPOSITORY_URL> .
    fi
}

# 配置环境变量
setup_env() {
    log "配置环境变量..."
    
    if [ ! -f ".env" ]; then
        warn "未找到 .env 文件，将从 .env.example 创建"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log "已创建 .env 文件，请根据需要修改其中的配置"
        else
            error "未找到 .env.example 文件，无法创建 .env"
            exit 1
        fi
    else
        log ".env 文件已存在"
    fi
}

# 配置 Docker 镜像源（针对中国用户）
configure_docker_registry() {
    log "检查 Docker 镜像源配置..."
    
    # 检查是否在中国大陆
    # 这里使用一个简单的方法：检查时区
    if [ "$(date +%z)" = "+0800" ]; then
        warn "检测到可能在中国大陆地区，如果遇到镜像拉取问题，建议配置 Docker 镜像加速器"
        echo "参考: https://github.com/docker-practice/docker-registry-cn-mirror-test/actions/workflows/registry-test.yml"
        echo "配置方法:"
        echo "  1. 编辑或创建 /etc/docker/daemon.json 文件"
        echo "  2. 添加以下内容:"
        echo '     {'
        echo '       "registry-mirrors": ['
        echo '         "https://docker.mirrors.ustc.edu.cn",'
        echo '         "https://hub-mirror.c.163.com"'
        echo '       ]'
        echo '     }'
        echo "  3. 重启 Docker 服务: sudo systemctl restart docker"
        echo
    fi
}

# 构建并启动 Docker 服务
deploy_with_docker() {
    log "开始 Docker 部署..."
    
    # 配置 Docker 镜像源提示
    configure_docker_registry
    
    # 停止可能正在运行的服务
    log "停止可能正在运行的服务..."
    $DOCKER_COMPOSE_CMD down >/dev/null 2>&1 || true
    
    # 构建并启动服务（带重试机制）
    log "构建并启动服务..."
    local max_attempts=3
    local attempt=1
    local success=false
    
    while [ $attempt -le $max_attempts ]; do
        log "尝试第 $attempt/$max_attempts 次构建和启动服务..."
        if $DOCKER_COMPOSE_CMD up -d --build; then
            success=true
            break
        else
            warn "第 $attempt 次尝试失败"
            if [ $attempt -lt $max_attempts ]; then
                log "等待 10 秒后重试..."
                sleep 10
            fi
            attempt=$((attempt + 1))
        fi
    done
    
    if [ "$success" = false ]; then
        error "构建和启动服务失败，请检查网络连接或 Docker 配置"
        error "如果遇到网络超时问题，请考虑配置 Docker 镜像加速器"
        exit 1
    fi
    
    # 等待服务启动
    log "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    log "检查服务状态..."
    if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
        log "服务启动成功"
    else
        error "服务启动失败，请检查日志: $DOCKER_COMPOSE_CMD logs"
        exit 1
    fi
}

# 初始化数据库
init_database() {
    log "初始化数据库..."
    
    # 获取应用容器名称
    APP_CONTAINER=$($DOCKER_COMPOSE_CMD ps -q app)
    
    if [ -z "$APP_CONTAINER" ]; then
        error "未找到应用容器"
        exit 1
    fi
    
    # 运行数据库初始化（带重试机制）
    log "运行数据库同步..."
    local max_attempts=3
    local attempt=1
    local success=false
    
    while [ $attempt -le $max_attempts ]; do
        log "尝试第 $attempt/$max_attempts 次数据库初始化..."
        if docker exec $APP_CONTAINER npm run db:init; then
            success=true
            break
        else
            warn "第 $attempt 次数据库初始化失败"
            if [ $attempt -lt $max_attempts ]; then
                log "等待 5 秒后重试..."
                sleep 5
            fi
            attempt=$((attempt + 1))
        fi
    done
    
    if [ "$success" = false ]; then
        error "数据库初始化失败"
        exit 1
    fi
    
    log "数据库初始化完成"
}

# 导入数据
import_data() {
    log "导入数据..."
    
    # 获取应用容器名称
    APP_CONTAINER=$($DOCKER_COMPOSE_CMD ps -q app)
    
    if [ -z "$APP_CONTAINER" ]; then
        error "未找到应用容器"
        exit 1
    fi
    
    # 运行数据导入（带重试机制）
    log "运行数据导入..."
    local max_attempts=3
    local attempt=1
    local success=false
    
    while [ $attempt -le $max_attempts ]; do
        log "尝试第 $attempt/$max_attempts 次数据导入..."
        if docker exec $APP_CONTAINER npm run import:data; then
            success=true
            break
        else
            warn "第 $attempt 次数据导入失败"
            if [ $attempt -lt $max_attempts ]; then
                log "等待 5 秒后重试..."
                sleep 5
            fi
            attempt=$((attempt + 1))
        fi
    done
    
    if [ "$success" = false ]; then
        error "数据导入失败"
        exit 1
    fi
    
    log "数据导入完成"
}

# 验证部署
verify_deployment() {
    log "验证部署..."
    
    # 检查 API 是否响应
    log "检查 API 响应..."
    sleep 5
    
    if command_exists curl; then
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/birds?limit=1 || echo "000")
        if [ "$RESPONSE" == "200" ]; then
            log "API 响应正常"
        else
            warn "API 响应异常，HTTP 状态码: $RESPONSE"
        fi
    else
        warn "未安装 curl，跳过 API 响应检查"
    fi
    
    log "部署验证完成"
}

# 显示部署完成信息
show_completion_message() {
    log "==========================================="
    log "BirdSong API 部署完成！"
    log "==========================================="
    echo
    log "服务已启动并运行在 http://localhost:3000"
    echo
    log "可用的管理命令:"
    log "  $DOCKER_COMPOSE_CMD logs          # 查看服务日志"
    log "  $DOCKER_COMPOSE_CMD ps            # 查看服务状态"
    log "  $DOCKER_COMPOSE_CMD down          # 停止服务"
    log "  $DOCKER_COMPOSE_CMD up -d         # 启动服务"
    log "  $DOCKER_COMPOSE_CMD restart       # 重启服务"
    echo
    log "如果遇到网络问题，请考虑配置 Docker 镜像加速器:"
    log "  参考: https://gist.github.com/y0ngb1n/7e8f8898c1788f8bb77d9b555a1d9183"
    echo
    log "API 文档请参考项目 README.md 文件"
}

# 主函数
main() {
    log "开始 BirdSong API 一键部署..."
    
    check_root
    check_dependencies
    # setup_repository  # 注释掉此行以避免在已有目录中克隆
    setup_env
    deploy_with_docker
    init_database
    import_data
    verify_deployment
    show_completion_message
    
    log "一键部署脚本执行完成"
}

# 执行主函数
main "$@"