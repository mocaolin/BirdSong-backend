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
const birdsJsonPath = path.join(__dirname, '../json_parts/birds.json');
const recordingsJsonPath = path.join(__dirname, '../json_parts/recordings.json');

// 检查数据文件是否存在
if (!fs.existsSync(birdsJsonPath)) {
  console.error(`Birds data file not found: ${birdsJsonPath}`);
  console.error('Current working directory:', process.cwd());
  console.error('Files in json_parts directory:');
  try {
    const files = fs.readdirSync(path.join(__dirname, '../json_parts'));
    console.error(files);
  } catch (err) {
    console.error('Error reading json_parts directory:', err.message);
  }
  process.exit(1);
}

if (!fs.existsSync(recordingsJsonPath)) {
  console.error(`Recordings data file not found: ${recordingsJsonPath}`);
  process.exit(1);
}

// 读取JSON文件并导入数据
let birdData, recordingData;
try {
  birdData = JSON.parse(fs.readFileSync(birdsJsonPath, 'utf8'));
  recordingData = JSON.parse(fs.readFileSync(recordingsJsonPath, 'utf8'));
} catch (error) {
  console.error('Error reading or parsing JSON files:', error.message);
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