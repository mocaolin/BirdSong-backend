# BirdSong API 部署文档

本文档详细说明了如何将 BirdSong API 部署到生产服务器。

## 目录

1. [系统要求](#系统要求)
2. [部署方式](#部署方式)
   - [方式一：使用 Docker 部署（推荐）](#方式一使用-docker-部署推荐)
   - [方式二：直接部署到服务器](#方式二直接部署到服务器)
3. [环境变量配置](#环境变量配置)
4. [数据库初始化](#数据库初始化)
5. [数据导入](#数据导入)
6. [启动应用](#启动应用)
7. [反向代理配置](#反向代理配置)
8. [常见问题](#常见问题)

## 系统要求

- Node.js >= 14.x
- PostgreSQL >= 12.x
- Docker (如果使用 Docker 部署方式)
- Nginx 或 Apache (用于反向代理，可选)

## 部署方式

### 方式一：使用 Docker 部署（推荐）

#### 1. 安装 Docker 和 Docker Compose

在服务器上安装 Docker 和 Docker Compose：

\```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# CentOS/RHEL
sudo yum install docker docker-compose

# 或者参考官方文档安装最新版本
\```

#### 2. 克隆代码库

\```bash
git clone <repository-url>
cd birdsong-api
\```

#### 3. 配置环境变量

编辑 [.env](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/.env) 文件，配置数据库连接和其他环境变量：

\```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=birdsong_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DIALECT=postgres
PORT=3000
NODE_ENV=production
\```

#### 4. 构建和启动服务

\```bash
# 使用 Docker Compose 启动所有服务（包括 PostgreSQL）
docker-compose up -d

# 或者只构建应用容器（如果已有外部数据库）
docker build -t birdsong-api .
docker run -d -p 3000:3000 --env-file .env birdsong-api
\```

#### 5. 初始化数据库

\```bash
# 进入应用容器
docker exec -it birdsong-api_app_1 bash

# 运行数据库同步
npm run db:init

# 运行数据导入脚本
npm run import:data
\```

### 方式二：直接部署到服务器

#### 1. 安装依赖

\```bash
# 安装 Node.js (使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
\```

#### 2. 克隆代码库

\```bash
git clone <repository-url>
cd birdsong-api
npm install --production
\```

#### 3. 配置 PostgreSQL

\```bash
# 启动 PostgreSQL 服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 切换到 postgres 用户并创建数据库
sudo -u postgres createdb birdsong_db
sudo -u postgres createuser your_db_user

# 设置用户密码和权限
sudo -u postgres psql
\```

在 PostgreSQL shell 中运行：

\```sql
ALTER USER your_db_user WITH PASSWORD 'your_db_password';
ALTER USER your_db_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE birdsong_db TO your_db_user;
\q
\```

#### 4. 配置环境变量

创建 [.env](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/.env) 文件：

\```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=birdsong_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DIALECT=postgres
PORT=3000
NODE_ENV=production
\```

## 数据库初始化

无论使用哪种部署方式，都需要初始化数据库结构：

\```bash
npm run db:init
\```

这将根据模型定义创建或更新数据库表结构。该命令执行的是 `scripts/syncDatabase.js` 脚本。

## 数据导入

运行数据导入脚本将鸟类和录音数据导入数据库：

\```bash
npm run import:data
\```

这将读取 `json_parts` 目录中的所有 JSON 文件并将数据导入数据库。该命令执行的是 `scripts/importData.js` 脚本。

## 启动应用

### 使用 PM2 管理进程（推荐）

PM2 是一个生产环境的 Node.js 进程管理器。

#### 1. 安装 PM2

\```bash
sudo npm install -g pm2
\```

#### 2. 启动应用

\```bash
pm2 start src/server.js --name birdsong-api
pm2 startup
pm2 save
\```

### 直接启动

\```bash
npm start
\```

或者在后台运行：

\```bash
nohup npm start > app.log 2>&1 &
\```

## 反向代理配置

建议使用 Nginx 作为反向代理服务器。

### 安装 Nginx

\```bash
sudo apt update
sudo apt install nginx
\```

### 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/birdsong`：

\```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
\```

启用配置：

\```bash
sudo ln -s /etc/nginx/sites-available/birdsong /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\```

### 配置 SSL 证书（可选但推荐）

使用 Let's Encrypt 获取免费 SSL 证书：

\```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
\```

## 常见问题

### 1. 数据库连接失败

检查以下几点：
- 数据库服务是否正在运行
- 环境变量配置是否正确
- 数据库用户权限是否正确
- 防火墙是否阻止了数据库端口

### 2. 数据导入失败

如果数据导入过程中出现错误：
- 检查数据格式是否正确
- 确保数据库表结构已正确创建
- 查看错误日志获取详细信息

### 3. API 无法访问

- 检查应用是否正在运行
- 检查防火墙设置
- 检查反向代理配置
- 查看应用日志获取错误信息

### 4. 性能问题

- 考虑为数据库添加索引
- 使用 PM2 集群模式运行多个应用实例
- 配置适当的缓存策略

## 监控和日志

### 查看应用日志

如果使用 PM2：

\```bash
pm2 logs birdsong-api
\```

### 监控应用状态

\```bash
pm2 monit
\```

## 更新部署

要更新到最新版本：

\```bash
# 拉取最新代码
git pull

# 安装新依赖
npm install --production

# 重启应用
pm2 reload birdsong-api

# 如果有数据库迁移
npm run db:migrate
\```

## 备份和恢复

### 数据库备份

\```bash
pg_dump -h localhost -U your_db_user birdsong_db > birdsong_backup.sql
\```

### 数据库恢复

\```bash
psql -h localhost -U your_db_user birdsong_db < birdsong_backup.sql
\```