# BirdSong-backend
# BirdSong API

BirdSong API 是一个为鸟类声音识别小程序提供后端服务的 RESTful API。该 API 提供鸟类信息和录音数据的查询功能。

## 功能特性

1. 获取鸟类列表（支持分页和搜索）
2. 获取特定鸟类的详细信息
3. 根据分类、地理位置等条件搜索鸟类
4. 获取鸟类录音列表（支持分页和筛选）
5. 获取特定录音的详细信息

## 技术栈

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM

## 目录结构

```
birdsong-api/
├── src/
│   ├── controllers/     # 控制器
│   ├── models/          # 数据模型
│   ├── routes/          # 路由
│   ├── config/          # 配置文件
│   └── app.js           # Express 应用入口
├── scripts/             # 数据导入等脚本
├── json_parts/          # JSON 数据文件
├── .env                 # 环境变量配置
└── package.json         # 项目依赖和脚本
```

## 快速开始

### 环境要求

- Node.js >= 14.x
- PostgreSQL >= 12.x

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 [.env](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/birdsong-api/.env) 文件并配置数据库连接：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=birdsong_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DIALECT=postgres
PORT=3000
```

### 初始化数据库

```bash
npm run db:init
```

### 导入数据

```bash
npm run import:data
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 上运行。

## API 接口文档

### 鸟类相关接口

#### 获取鸟类列表

```http
GET /api/birds?page=1&limit=10&search=麻雀
```

**参数:**
- `page` (可选) - 页码，默认为 1
- `limit` (可选) - 每页条数，默认为 10
- `search` (可选) - 搜索关键词

**响应示例:**
```json
{
  "birds": [...],
  "currentPage": 1,
  "totalPages": 10,
  "totalBirds": 100
}
```

#### 获取特定鸟类详情

```http
GET /api/birds/:id
```

**参数:**
- `id` - 鸟类 ID

**响应示例:**
```json
{
  "id": 1,
  "scientificName": "Passer domesticus",
  "cnCommon": "麻雀",
  "commonName": "House Sparrow",
  "orderName": "雀形目",
  "family": "雀科",
  "genus": "Passer",
  "species": "domesticus",
  "subspecies": "",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

#### 搜索鸟类

```http
GET /api/birds/search?family=Anatidae&order=雁形目&genus=Anas
```

**参数:**
- `family` (可选) - 科
- `order` (可选) - 目
- `genus` (可选) - 属

**响应示例:**
```json
[
  {
    "id": 1,
    "scientificName": "Anas platyrhynchos",
    "cnCommon": "绿头鸭",
    "commonName": "Mallard",
    "orderName": "雁形目",
    "family": "鸭科",
    "genus": "Anas",
    "species": "platyrhynchos"
  }
]
```

### 录音相关接口

#### 获取录音列表

```http
GET /api/recordings?page=1&limit=10&birdId=1&quality=A
```

**参数:**
- `page` (可选) - 页码，默认为 1
- `limit` (可选) - 每页条数，默认为 10
- `birdId` (可选) - 鸟类 ID
- `quality` (可选) - 录音质量 (A, B, C, no score)

**响应示例:**
```json
{
  "recordings": [...],
  "currentPage": 1,
  "totalPages": 5,
  "totalRecordings": 50
}
```

#### 获取特定录音详情

```http
GET /api/recordings/:id
```

**参数:**
- `id` - 录音 ID

**响应示例:**
```json
{
  "id": 1,
  "birdId": 1,
  "type": "鸣叫",
  "sex": "雄性",
  "stage": "成鸟",
  "recorder": "张三",
  "country": "中国",
  "region": "北京市",
  "date": "2023-01-01T00:00:00.000Z",
  "lat": 39.9042,
  "lng": 116.4074,
  "quality": "A",
  "url": "https://example.com/recording.mp3",
  "sonoLarge": "https://example.com/sono_large.png",
  "sonoFull": "https://example.com/sono_full.png",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

## 部署

请参考 [部署文档](DEPLOYMENT.md) 了解如何将应用部署到生产服务器。

## 开发

### 代码结构

- `src/app.js` - Express 应用配置
- `src/server.js` - 服务器启动文件
- `src/models/` - Sequelize 数据模型
- `src/controllers/` - 控制器逻辑
- `src/routes/` - 路由定义
- `scripts/importData.js` - 数据导入脚本

### 运行测试

```bash
npm test
```

## 许可证

MIT