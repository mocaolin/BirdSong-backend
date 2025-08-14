# BirdSong API 部署文档

本文档详细说明了如何将 BirdSong API 部署到生产服务器。

## 目录

1. [系统要求](#系统要求)
2. [部署方式](#部署方式)
   - [方式一：使用一键部署脚本（推荐）](#方式一使用一键部署脚本推荐)
   - [方式二：使用 Docker 部署](#方式二使用-docker-部署)
   - [方式三：直接部署到服务器](#方式三直接部署到服务器)
3. [环境变量配置](#环境变量配置)
4. [数据库初始化](#数据库初始化)
5. [数据导入](#数据导入)
6. [启动应用](#启动应用)
7. [反向代理配置](#反向代理配置)
8. [SSL 证书配置](#ssl-证书配置)
9. [监控和日志](#监控和日志)
10. [更新部署](#更新部署)
11. [常见问题](#常见问题)
12. [Docker 镜像源配置](#docker-镜像源配置)

## 系统要求

- Docker 和 Docker Compose
- 至少 2GB RAM 的服务器
- 约 2GB 磁盘空间

## 部署方式

### 方式一：使用一键部署脚本（推荐）

项目提供了一键部署脚本 [deploy.sh](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/deploy.sh)，可以自动完成整个部署过程。

#### 1. 下载脚本

```bash
# 克隆代码库
git clone <repository-url>
cd birdsong-api
```

#### 2. 运行一键部署脚本

```bash
# 给脚本添加执行权限
chmod +x deploy.sh

# 运行一键部署脚本
./deploy.sh
```

脚本将自动完成以下操作：
1. 检查依赖（Docker、docker-compose、git）
2. 配置环境变量
3. 构建并启动 Docker 服务
4. 初始化数据库
5. 导入数据
6. 验证部署

#### 3. 验证部署

部署完成后，可以通过以下命令验证服务状态：

```bash
# 查看服务状态
docker-compose ps

# 查看应用日志
docker-compose logs app

# 测试 API
curl http://localhost:3000/api/birds?page=1&limit=5
```

### 方式二：使用 Docker 部署

#### 1. 安装 Docker 和 Docker Compose

在服务器上安装 Docker 和 Docker Compose：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# CentOS/RHEL
sudo yum install docker docker-compose

# 或者参考官方文档安装最新版本
```

启动并启用 Docker：

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

#### 2. 克隆代码库

```bash
git clone <repository-url>
cd birdsong-api
```

#### 3. 配置环境变量

创建 [.env](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/.env) 文件，配置应用环境变量：

```env
DB_HOST=db
DB_PORT=5432
DB_NAME=birdsong_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_DIALECT=postgres
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
```

注意：在 Docker 部署中，[DB_HOST](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/src/config/database.js#L4-L4) 应设置为 [db](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/docker-compose.yml#L4-L4)（docker-compose.yml 中定义的服务名称），而不是 localhost。

#### 4. 构建和启动服务

使用 Docker Compose 启动所有服务（包括 PostgreSQL 数据库和 BirdSong API 应用）：

```bash
docker-compose up -d
```

此命令将：
- 构建 BirdSong API 应用镜像
- 启动 PostgreSQL 数据库容器
- 启动 BirdSong API 应用容器

如果遇到网络连接问题，可能需要配置 Docker 镜像源，请参考 [Docker 镜像源配置](#docker-镜像源配置) 部分。

#### 5. 初始化数据库

首次部署时，需要初始化数据库结构：

```bash
# 进入应用容器
docker exec -it birdsong_api bash

# 运行数据库同步
npm run db:init

# 退出容器
exit
```

#### 6. 导入数据

运行数据导入脚本将鸟类和录音数据导入数据库：

```bash
# 进入应用容器
docker exec -it birdsong_api bash

# 运行数据导入脚本
npm run import:data

# 退出容器
exit
```

#### 7. 验证部署

检查服务状态：

```bash
docker-compose ps
```

查看应用日志：

```bash
docker-compose logs app
```

测试 API 是否正常工作：

```bash
curl http://localhost:3000/api/birds?page=1&limit=5
```

### 方式三：直接部署到服务器

#### 1. 安装依赖

```
# 安装 Node.js (使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### 2. 克隆代码库

```
git clone <repository-url>
cd birdsong-api
npm install --production
```

#### 3. 配置 PostgreSQL

```
# 启动 PostgreSQL 服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 切换到 postgres 用户并创建数据库
sudo -u postgres createdb birdsong_db
sudo -u postgres createuser your_db_user

# 设置用户密码和权限
sudo -u postgres psql
```

在 PostgreSQL shell 中运行：

```
ALTER USER your_db_user WITH PASSWORD 'your_db_password';
ALTER USER your_db_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE birdsong_db TO your_db_user;
\q
```

#### 4. 配置环境变量

创建 [.env](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/.env) 文件：

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=birdsong_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DIALECT=postgres
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
```

## 环境变量配置

以下环境变量可以在 [.env](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/.env) 文件中配置：

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| DB_HOST | 数据库主机地址 | localhost |
| DB_PORT | 数据库端口 | 5432 |
| DB_NAME | 数据库名称 | birdsong_db |
| DB_USER | 数据库用户名 | - |
| DB_PASSWORD | 数据库密码 | - |
| DB_DIALECT | 数据库类型 | postgres |
| PORT | 应用监听端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| JWT_SECRET | JWT 密钥 | - |

## 数据库初始化

无论使用哪种部署方式，都需要初始化数据库结构：

```
npm run db:init
```

这将根据模型定义创建或更新数据库表结构。该命令执行的是 `scripts/syncDatabase.js` 脚本。

## 数据导入

运行数据导入脚本将鸟类和录音数据导入数据库：

```
npm run import:data
```

这将读取 `json_parts` 目录中的所有 JSON 文件并将数据导入数据库。该命令执行的是 `scripts/importData.js` 脚本。

## 启动应用

### 使用 PM2 管理进程（推荐）

PM2 是一个生产环境的 Node.js 进程管理器。

#### 1. 安装 PM2

```
sudo npm install -g pm2
```

#### 2. 启动应用

```
pm2 start src/server.js --name birdsong-api
pm2 startup
pm2 save
```

### 直接启动

```
npm start
```

或者在后台运行：

```
nohup npm start > app.log 2>&1 &
```

## 反向代理配置

建议使用 Nginx 作为反向代理服务器。

### 安装 Nginx

```
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 配置 Nginx

创建 Nginx 配置文件 `/etc/nginx/sites-available/birdsong-api`：

```
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
```

启用配置：

```
sudo ln -s /etc/nginx/sites-available/birdsong-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL 证书配置

使用 Let's Encrypt 免费 SSL 证书：

### 1. 安装 Certbot

```
sudo apt install certbot python3-certbot-nginx
```

### 2. 获取 SSL 证书

```
sudo certbot --nginx -d your_domain.com
```

Certbot 会自动修改 Nginx 配置并重启 Nginx。

## 监控和日志

### 查看应用日志

如果使用 PM2：

```
pm2 logs birdsong-api
```

如果使用 Docker：

```
docker-compose logs -f app
```

### 系统监控

可以使用 htop、iotop 等工具监控系统资源使用情况：

```
sudo apt install htop iotop
htop
iotop
```

## 更新部署

### 使用 Docker 更新

```
# 拉取最新代码
git pull

# 重新构建并启动容器
docker-compose down
docker-compose up -d --build
```

### 直接部署更新

```
# 拉取最新代码
git pull

# 安装新依赖
npm install --production

# 重启应用
pm2 restart birdsong-api
```

## 常见问题

### 1. 数据库连接失败

检查以下几点：
- 数据库服务是否正在运行
- 数据库连接参数是否正确
- 数据库用户是否有正确的权限
- 防火墙是否阻止了数据库端口

### 2. API 返回 502 错误

如果使用 Nginx 作为反向代理，可能是应用未启动或端口配置错误。

### 3. 内存不足

如果服务器内存不足，考虑添加交换空间：

```
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Docker 镜像源配置

在某些网络环境下（特别是中国大陆地区），直接从 Docker Hub 拉取镜像可能会遇到网络超时问题。为了解决这个问题，可以配置 Docker 镜像加速器。

### 配置方法

1. 编辑或创建 `/etc/docker/daemon.json` 文件：
   ```bash
   sudo nano /etc/docker/daemon.json
   ```

2. 添加以下内容：
   ```json
   {
     "registry-mirrors": [
       "https://docker.mirrors.ustc.edu.cn",
       "https://hub-mirror.c.163.com"
     ]
   }
   ```

3. 重启 Docker 服务：
   ```bash
   sudo systemctl restart docker
   ```

配置完成后，再次尝试部署应用。

### 其他解决方案

如果配置镜像源后仍然存在问题，可以尝试以下方法：

1. 手动拉取所需的镜像：
   ```bash
   docker pull postgres:15
   docker pull node:16
   ```

2. 使用一键部署脚本，它内置了重试机制来处理网络问题。

3. 如果网络问题持续存在，可以考虑使用代理或 VPN。
