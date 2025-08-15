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

- Docker 和 Docker Compose (如果使用 Docker 部署方式)
- Node.js >= 14.x
- npm >= 6.x
- 至少 2GB RAM 的服务器
- 约 2GB 磁盘空间

## 部署方式

### 方式一：使用一键部署脚本（推荐）

项目提供了一键部署脚本 [deploy.sh](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/deploy.sh)，可以自动完成整个部署过程。

#### 1. 下载脚本

```
# 克隆代码库
git clone <repository-url>
cd birdsong-api
```

#### 2. 运行一键部署脚本

```
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

```
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

```
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# CentOS/RHEL
sudo yum install docker docker-compose

# 或者参考官方文档安装最新版本
```

启动并启用 Docker：

```
sudo systemctl start docker
sudo systemctl enable docker
```

#### 3. 克隆代码库

```
git clone <repository-url>
cd birdsong-api
```

#### 4. 配置环境变量

创建 [.env](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/.env) 文件，配置应用环境变量：

```
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

#### 5. 构建和启动服务

使用 Docker Compose 启动所有服务（包括 PostgreSQL 数据库和 BirdSong API 应用）：

```
docker-compose up -d
```

此命令将：
- 构建 BirdSong API 应用镜像
- 启动 PostgreSQL 数据库容器
- 启动 BirdSong API 应用容器

如果遇到网络连接问题，可能需要配置 Docker 镜像源，请参考 [Docker 镜像源配置](#docker-镜像源配置) 部分。

#### 6. 初始化数据库

首次部署时，需要初始化数据库结构：

```
# 进入应用容器
docker exec -it birdsong_api bash

# 运行数据库同步
npm run db:init

# 退出容器
exit
```

#### 7. 导入数据

运行数据导入脚本将鸟类和录音数据导入数据库：

```
# 进入应用容器
docker exec -it birdsong_api bash

# 运行数据导入脚本
npm run import:data

# 退出容器
exit
```

#### 8. 验证部署

检查服务状态：

```
docker-compose ps
```

查看应用日志：

```
docker-compose logs app
```

测试 API 是否正常工作：

```
curl http://localhost:3000/api/birds?page=1&limit=5
```

### 方式三：直接部署到服务器

如果您遇到 Docker 网络问题或希望直接在服务器上部署应用（不使用容器），可以使用直接部署方式。

项目提供了直接部署脚本 [deploy-direct.sh](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/deploy-direct.sh) 来简化部署过程。

#### 1. 安装依赖

首先确保服务器上安装了必要的依赖：

```
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm git postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install nodejs npm git
# PostgreSQL 安装请参考下面的详细说明
```

注意：如果您的系统中 npm 版本较新（npm 7+），请确保 [package.json](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/node_modules/@babel/core/package.json) 和 [package-lock.json](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/package-lock.json) 文件保持同步。部署脚本会自动处理这个问题。

#### 2. 安装和配置 PostgreSQL（CentOS/RHEL）

在 CentOS/RHEL 系统上安装 PostgreSQL 需要特别注意，因为默认仓库中的版本可能较旧。

##### 安装 PostgreSQL

```
# CentOS 7
sudo yum install epel-release
sudo yum install postgresql-server postgresql-contrib

# 初始化数据库（CentOS 7）
sudo postgresql-setup initdb

# CentOS 8+/RHEL 8+
# 安装 PostgreSQL 15（推荐）
sudo dnf install -y epel-release
sudo dnf install -y postgresql15-server postgresql15-contrib

# 初始化数据库（CentOS 8+/RHEL 8+）
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb
```

##### 启动并启用 PostgreSQL 服务

```
# CentOS 7
sudo systemctl start postgresql
sudo systemctl enable postgresql

# CentOS 8+/RHEL 8+（PostgreSQL 15）
sudo systemctl start postgresql-15
sudo systemctl enable postgresql-15
```

##### 配置 PostgreSQL 认证

编辑 PostgreSQL 认证配置文件以允许本地连接：

```
# CentOS 7
sudo nano /var/lib/pgsql/data/pg_hba.conf

# CentOS 8+/RHEL 8+（PostgreSQL 15）
sudo nano /var/lib/pgsql/15/data/pg_hba.conf
```

找到以下行并修改：

```
# 将:
local   all             all                                     peer
host    all             all             127.0.0.1/32            ident

# 修改为:
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
```

重启 PostgreSQL 服务以应用更改：

```
# CentOS 7
sudo systemctl restart postgresql

# CentOS 8+/RHEL 8+（PostgreSQL 15）
sudo systemctl restart postgresql-15
```

#### 3. 配置 PostgreSQL

```
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

#### 4. 克隆代码库

```
git clone <repository-url>
cd birdsong-api
```

#### 5. 运行直接部署脚本

```
# 给脚本添加执行权限
chmod +x deploy-direct.sh

# 运行直接部署脚本
./deploy-direct.sh
```

脚本将自动完成以下操作：
1. 检查依赖（Node.js、npm、git）
2. 配置环境变量
3. 安装 Node.js 依赖
4. 检查数据库连接
5. 初始化数据库
6. 导入数据
7. 安装并配置 PM2 进程管理器
8. 启动应用
9. 验证部署

#### 6. 配置环境变量

脚本会提示您配置 [.env](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/.env) 文件，确保数据库连接参数正确：

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

注意：在直接部署中，[DB_HOST](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/src/config/database.js#L4-L4) 应设置为 `localhost`，而不是 Docker 服务名称。

#### 7. 验证部署

部署完成后，可以通过以下命令验证服务状态：

```
# 查看应用状态
pm2 list

# 查看应用日志
pm2 logs birdsong-api

# 测试 API
curl http://localhost:3000/api/birds?page=1&limit=5
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

### 4. PostgreSQL 服务未找到（CentOS）

如果您在 CentOS 系统上遇到 `Failed to start postgresql.service: Unit not found` 错误，请按照以下步骤操作：

1. 确认 PostgreSQL 是否已安装：
   ```bash
   # 检查是否安装了 PostgreSQL
   rpm -qa | grep postgresql
   
   # 或者尝试查找 PostgreSQL 相关包
   yum list installed | grep postgresql
   ```

2. 如果未安装，请按照[安装和配置 PostgreSQL（CentOS/RHEL）](#2-安装和配置-postgresqlcentosrhel)部分的说明进行安装。

3. 如果已安装但服务名称不同，请尝试以下命令查找正确的服务名称：
   ```bash
   # 查找所有 PostgreSQL 相关服务
   systemctl list-unit-files | grep postgresql
   
   # 或者查找正在运行的服务
   ps aux | grep postgres
   ```

4. 根据找到的服务名称启动 PostgreSQL：
   ```bash
   # 常见的服务名称
   sudo systemctl start postgresql
   sudo systemctl start postgresql-15
   sudo systemctl start postgresql-13
   ```

5. 设置开机自启：
   ```bash
   # 根据实际服务名称设置
   sudo systemctl enable postgresql
   sudo systemctl enable postgresql-15
   ```

### 5. npm ci 命令错误

如果您遇到类似以下的错误：

```
npm WARN config only Use `--omit=dev` to omit dev dependencies from the install.
npm ERR! code EUSAGE
npm ERR!
npm ERR! `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.
```

这通常是因为以下两个原因之一：

1. **npm 版本较新**：npm 7+ 版本改变了参数语法，使用 `--omit=dev` 替代了 `--only=production`。

2. **依赖文件不同步**：[package.json](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/node_modules/@babel/core/package.json) 和 [package-lock.json](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/package-lock.json) 文件不同步。

解决方法：
1. 更新 [package-lock.json](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/package-lock.json) 文件：
   ```bash
   npm install --package-lock-only
   ```

2. 或者让部署脚本自动处理：
   我们的部署脚本（[deploy.sh](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/deploy.sh) 和 [deploy-direct.sh](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/deploy-direct.sh)）已经更新，可以自动处理不同版本的 npm 命令并确保依赖文件同步。

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
