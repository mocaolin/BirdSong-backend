# BirdSong 后端 API - 需求分析

## 1. 项目概述

BirdSong 项目旨在开发一个后端 API 系统，为鸟类鸣声小程序提供数据服务。系统将存储和提供鸟类叫声录音的元数据，使用户能够搜索、浏览和访问鸟类声音信息。

## 2. 需求分析

### 2.1 数据结构分析

根据 [json_parts](file:///Users/jacklin/Documents/BackEndProject/BirdSong-backend/json_parts) 目录中的 JSON 文件，每条鸟类声音记录包含以下字段：

- `cn_common`: 鸟类的中文通用名称
- `scientific_name`: 鸟类学名
- `common_name`: 鸟类英文通用名称
- `type`: 录音类型（叫声、飞行叫声、歌声等）
- `order`: 鸟类分类系统中的目
- `family`: 鸟类分类系统中的科
- `genus`: 鸟类分类系统中的属
- `species`: 物种名称
- `subspecies`: 亚种名称（如适用）
- `sex`: 鸟类性别（如已识别）
- `stage`: 鸟类生命阶段（成鸟、幼鸟等）
- `recorder`: 音频录制者
- `country`: 录制国家
- `region`: 录制的具体地区
- `license`: 录音许可信息
- `duration`: 音频时长
- `sono_large`: 大型声谱图图片 URL
- `sono_full`: 完整声谱图图片 URL
- `habitat`: 栖息地信息
- `date`: 录制日期
- `lat`: 录制地点纬度
- `lng`: 录制地点经度
- `quality`: 录音质量评级
- `url`: 音频文件下载 URL

### 2.2 功能需求

1. **数据导入**
   - 将所有 JSON 数据文件导入数据库
   - 处理数据验证和清洗
   - 确保数据一致性和完整性

2. **API 接口**
   - 分页列出所有鸟类物种
   - 根据多种条件搜索鸟类（名称、地点、录制者等）
   - 获取特定鸟类的详细信息
   - 按分类系统筛选（目、科、属）
   - 按地理位置筛选
   - 按录音质量和类型筛选

3. **数据管理**
   - 对鸟类声音数据进行 CRUD 操作
   - 数据更新和同步功能

### 2.3 非功能需求

1. **性能**
   - API 查询响应速度快（简单查询 < 200ms）
   - 支持并发用户访问

2. **可扩展性**
   - 能够处理不断增长的数据集
   - 具备水平扩展能力

3. **安全性**
   - 防范常见网络安全漏洞
   - API 访问速率限制

4. **可靠性**
   - 高可用性（99.9%）
   - 数据备份和恢复机制

## 3. 技术架构

### 3.1 技术选型

#### 后端框架
**Node.js with Express.js**
- 优点：轻量、快速、生态系统庞大、适合 API 开发
- 缺点：单线程特性在处理 CPU 密集型任务时可能受限

备选方案：**Python with FastAPI**
- 优点：数据处理能力优秀、科学数据生态系统丰富、性能良好
- 缺点：部署稍复杂

#### 数据库
**PostgreSQL**
- 优点：强大的关系型数据库、适合结构化数据、支持 JSON 字段、强一致性
- 缺点：相比简单数据库可能需要更多资源

备选方案：**MongoDB**
- 优点：基于文档、模式灵活、适合 JSON 类数据
- 缺点：结构化程度较低、可能需要更多存储空间

#### API 文档
**Swagger/OpenAPI**
- API 文档标准工具
- 提供交互式测试界面

#### 部署方案
**Docker + Docker Compose**
- 通过容器化实现轻松部署和扩展
- 在开发和生产环境中保持环境一致性

### 3.2 系统架构

```
[小程序] <-> [API 网关/负载均衡器] <-> [后端 API 服务]
                          |
                          v
                    [数据库]
```

### 3.3 数据库表结构设计

```sql
-- 鸟类表
CREATE TABLE birds (
    id SERIAL PRIMARY KEY,
    cn_common VARCHAR(255),
    scientific_name VARCHAR(255) UNIQUE NOT NULL,
    common_name VARCHAR(255),
    order_name VARCHAR(100),
    family VARCHAR(100),
    genus VARCHAR(100),
    species VARCHAR(100),
    subspecies VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 录音表
CREATE TABLE recordings (
    id SERIAL PRIMARY KEY,
    bird_id INTEGER REFERENCES birds(id),
    type VARCHAR(100),
    sex VARCHAR(50),
    stage VARCHAR(50),
    recorder VARCHAR(255),
    country VARCHAR(100),
    region TEXT,
    license TEXT,
    duration VARCHAR(20),
    sono_large TEXT,
    sono_full TEXT,
    habitat TEXT,
    date DATE,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    quality CHAR(1),
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 性能索引
CREATE INDEX idx_birds_scientific_name ON birds(scientific_name);
CREATE INDEX idx_birds_family ON birds(family);
CREATE INDEX idx_birds_order ON birds(order_name);
CREATE INDEX idx_recordings_country ON recordings(country);
CREATE INDEX idx_recordings_date ON recordings(date);
CREATE INDEX idx_recordings_quality ON recordings(quality);
```

## 4. API 设计

### 4.1 接口端点

1. **GET /api/birds**
   - 分页列出所有鸟类
   - 查询参数：page, limit, search, order, family 等

2. **GET /api/birds/{id}**
   - 获取特定鸟类的详细信息

3. **GET /api/birds/{id}/recordings**
   - 获取特定鸟类的所有录音

4. **GET /api/recordings**
   - 列出所有录音并支持筛选

5. **GET /api/recordings/{id}**
   - 获取特定录音的详细信息

6. **GET /api/search**
   - 高级搜索接口

### 4.2 响应示例

```json
{
  "id": 1,
  "cn_common": "栗树鸭",
  "scientific_name": "Dendrocygna javanica",
  "common_name": "Lesser Whistling Duck",
  "order": "ANSERIFORMES",
  "family": "Anatidae",
  "genus": "Dendrocygna",
  "species": "javanica",
  "subspecies": "",
  "recordings": [
    {
      "id": 1,
      "type": "call, flight call",
      "sex": "female, male",
      "stage": "adult, juvenile",
      "recorder": "Joost van Bruggen",
      "country": "Cambodia",
      "region": "Prey Veng-marsh, Cambodia",
      "license": "//creativecommons.org/licenses/by-nc-nd/4.0/",
      "duration": "0:58",
      "sono_large": "https://xeno-canto.org/sounds/uploaded/RNMRWBXEZJ/ffts/XC991324-large.png",
      "sono_full": "https://xeno-canto.org/sounds/uploaded/RNMRWBXEZJ/ffts/XC991324-full.png",
      "habitat": "",
      "date": "2025-02-25",
      "lat": "13.9334",
      "lng": "104.5544",
      "quality": "A",
      "url": "https://xeno-canto.org/991324/download"
    }
  ]
}
```