#!/bin/bash

# BirdSong API 直接部署脚本（不使用 Docker）
# 该脚本将直接在服务器上部署 BirdSong API 应用

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
    
    if ! command_exists node; then
        error "未找到 Node.js，请先安装 Node.js"
        exit 1
    fi
    
    if ! command_exists npm; then
        error "未找到 npm，请先安装 Node.js 和 npm"
        exit 1
    fi
    
    if ! command_exists git; then
        error "未找到 git，请先安装 git"
        exit 1
    fi
    
    # 检查 Node.js 版本
    NODE_VERSION=$(node -v)
    log "Node.js 版本: $NODE_VERSION"
    
    if [[ $NODE_VERSION =~ v([0-9]+) ]] && [ "${BASH_REMATCH[1]}" -lt 14 ]; then
        error "Node.js 版本过低，需要 Node.js 14.x 或更高版本"
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
            echo
            warn "请编辑 .env 文件并配置正确的数据库连接信息"
            warn "特别是 DB_HOST, DB_USER, DB_PASSWORD 等参数"
            echo
            read -p "请确认已配置好 .env 文件后按回车继续..."
        else
            error "未找到 .env.example 文件，无法创建 .env"
            exit 1
        fi
    else
        log ".env 文件已存在"
    fi
}

# 安装 Node.js 依赖
install_dependencies() {
    log "安装 Node.js 依赖..."
    
    # 清理可能存在的 node_modules
    if [ -d "node_modules" ]; then
        log "清理旧的 node_modules..."
        rm -rf node_modules
    fi
    
    # 安装生产依赖
    log "安装生产依赖..."
    npm ci --only=production
    
    log "Node.js 依赖安装完成"
}

# 检查数据库连接
check_database_connection() {
    log "检查数据库连接..."
    
    # 使用 Node.js 脚本检查数据库连接
    node << 'EOF'
const fs = require('fs');
const path = require('path');

// 简单解析 .env 文件
function parseEnvFile() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) {
    console.error('未找到 .env 文件');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
      }
    }
  });
  
  return envVars;
}

// 检查必要配置
const envVars = parseEnvFile();
const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredVars.filter(varName => !envVars[varName]);

if (missingVars.length > 0) {
  console.error(`缺少必要的数据库配置: ${missingVars.join(', ')}`);
  process.exit(1);
}

console.log('数据库配置检查通过');
EOF
    
    if [ $? -ne 0 ]; then
        error "数据库配置检查失败，请检查 .env 文件中的数据库连接配置"
        exit 1
    fi
    
    log "数据库连接配置检查完成"
}

# 初始化数据库
init_database() {
    log "初始化数据库..."
    
    # 运行数据库初始化
    log "运行数据库同步..."
    npm run db:init
    
    log "数据库初始化完成"
}

# 导入数据
import_data() {
    log "导入数据..."
    
    # 运行数据导入
    log "运行数据导入..."
    npm run import:data
    
    log "数据导入完成"
}

# 安装 PM2 进程管理器
install_pm2() {
    log "检查 PM2 进程管理器..."
    
    if ! command_exists pm2; then
        log "安装 PM2..."
        npm install -g pm2
    else
        log "PM2 已安装"
    fi
}

# 启动应用
start_application() {
    log "启动应用..."
    
    # 停止可能正在运行的应用
    pm2 stop birdsong-api >/dev/null 2>&1 || true
    pm2 delete birdsong-api >/dev/null 2>&1 || true
    
    # 启动应用
    pm2 start src/server.js --name birdsong-api
    
    # 保存 PM2 配置
    pm2 save
    
    # 设置开机自启
    pm2 startup >/dev/null 2>&1 || true
    
    log "应用启动完成"
}

# 验证部署
verify_deployment() {
    log "验证部署..."
    
    # 检查应用是否运行
    log "检查应用运行状态..."
    if pm2 list | grep -q "birdsong-api.*online"; then
        log "应用正在运行"
    else
        warn "应用可能未正常运行，请检查: pm2 logs birdsong-api"
    fi
    
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
    log "BirdSong API 直接部署完成！"
    log "==========================================="
    echo
    log "服务已启动并运行在 http://localhost:3000"
    echo
    log "可用的管理命令:"
    log "  pm2 list              # 查看应用列表"
    log "  pm2 logs birdsong-api # 查看应用日志"
    log "  pm2 stop birdsong-api # 停止应用"
    log "  pm2 restart birdsong-api # 重启应用"
    echo
    log "API 文档请参考项目 README.md 文件"
}

# 主函数
main() {
    log "开始 BirdSong API 直接部署..."
    
    check_root
    check_dependencies
    # setup_repository  # 注释掉此行以避免在已有目录中克隆
    setup_env
    install_dependencies
    check_database_connection
    init_database
    import_data
    install_pm2
    start_application
    verify_deployment
    show_completion_message
    
    log "直接部署脚本执行完成"
}

# 执行主函数
main "$@"