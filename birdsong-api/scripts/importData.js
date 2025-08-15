import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../src/models/index.js';
import Bird from '../src/models/Bird.js';
import Recording from '../src/models/Recording.js';
import dotenv from 'dotenv';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 构建数据文件路径
const jsonPartsDir = path.join(__dirname, '../json_parts');

// 检查数据目录是否存在
if (!fs.existsSync(jsonPartsDir)) {
  console.error(`JSON data directory not found: ${jsonPartsDir}`);
  console.error('Current working directory:', process.cwd());
  console.error('User ID:', process.getuid());
  console.error('Group ID:', process.getgid());
  
  // 尝试列出上级目录内容
  try {
    const parentDir = path.join(__dirname, '..');
    console.error('Files in parent directory:', fs.readdirSync(parentDir));
  } catch (err) {
    console.error('Error reading parent directory:', err.message);
  }
  
  process.exit(1);
}

// 检查目录访问权限
try {
  fs.accessSync(jsonPartsDir, fs.constants.R_OK);
} catch (err) {
  console.error(`Permission denied accessing directory: ${jsonPartsDir}`);
  console.error('Error details:', err.message);
  console.error('Current user:', process.getuid());
  
  // 尝试列出目录信息
  try {
    const stats = fs.statSync(jsonPartsDir);
    console.error('Directory stats:', stats);
  } catch (statErr) {
    console.error('Error getting directory stats:', statErr.message);
  }
  
  process.exit(1);
}

// 读取所有分片的JSON文件
let birdData = [];
let recordingData = [];

try {
  const files = fs.readdirSync(jsonPartsDir);
  console.log(`Found ${files.length} files in json_parts directory`);
  
  // 过滤出JSON文件并按名称排序
  const jsonFiles = files
    .filter(file => path.extname(file) === '.json')
    .sort();
  
  console.log(`Processing ${jsonFiles.length} JSON files`);
  
  // 读取所有JSON文件
  for (const file of jsonFiles) {
    const filePath = path.join(jsonPartsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    // 合并数据
    if (jsonData.birds) {
      birdData = birdData.concat(jsonData.birds);
    }
    
    if (jsonData.recordings) {
      recordingData = recordingData.concat(jsonData.recordings);
    }
  }
  
  console.log(`Total birds data: ${birdData.length}`);
  console.log(`Total recordings data: ${recordingData.length}`);
} catch (error) {
  console.error('Error reading or parsing JSON files:', error.message);
  console.error('Error code:', error.code);
  console.error('Current working directory:', process.cwd());
  process.exit(1);
}

async function importBirds() {
  console.log('Importing birds...');
  try {
    // 先同步数据库结构
    await db.sequelize.sync();
    
    // 清空现有数据
    await Bird.destroy({ where: {} });
    
    // 导入鸟类数据
    const birds = birdData.map(bird => ({
      cnCommon: bird.cn_common,
      scientificName: bird.scientific_name,
      commonName: bird.common_name,
      orderName: bird.order,
      family: bird.family,
      genus: bird.genus,
      species: bird.species,
      subspecies: bird.subspecies,
    }));
    
    await Bird.bulkCreate(birds);
    console.log(`Successfully imported ${birds.length} birds`);
  } catch (error) {
    console.error('Error importing birds:', error);
    throw error;
  }
}

async function importRecordings() {
  console.log('Importing recordings...');
  try {
    // 先同步数据库结构
    await db.sequelize.sync();
    
    // 清空现有数据
    await Recording.destroy({ where: {} });
    
    // 导入录音数据
    const recordings = recordingData.map(recording => ({
      birdId: recording.bird_id,
      type: recording.type,
      sex: recording.sex,
      stage: recording.stage,
      recorder: recording.recorder,
      country: recording.country,
      region: recording.region,
      license: recording.license,
      duration: recording.duration,
      sonoLarge: recording.sono_large,
      sonoFull: recording.sono_full,
      habitat: recording.habitat,
      date: recording.date,
      lat: recording.lat,
      lng: recording.lng,
      quality: recording.quality,
      url: recording.url,
    }));
    
    await Recording.bulkCreate(recordings);
    console.log(`Successfully imported ${recordings.length} recordings`);
  } catch (error) {
    console.error('Error importing recordings:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting data import process...');
    
    // 等待数据库连接
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // 导入数据
    await importBirds();
    await importRecordings();
    
    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error during data import:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await db.sequelize.close();
  }
}

// 运行导入脚本
main();