import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../src/models/index.js';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Bird = db.Bird;
const Recording = db.Recording;

// 读取JSON文件并导入数据
async function importData() {
  try {
    // 测试数据库连接
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // 同步数据库模型
    await db.sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');

    // 获取json_parts目录路径
    const jsonPartsDir = path.join(__dirname, '..', '..', 'json_parts');
    
    // 读取所有JSON文件
    const jsonFiles = fs.readdirSync(jsonPartsDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} JSON files to import`);
    
    let totalBirds = 0;
    let totalRecordings = 0;
    
    // 遍历所有JSON文件
    for (const file of jsonFiles) {
      console.log(`Processing ${file}...`);
      
      const filePath = path.join(jsonPartsDir, file);
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // 处理每条记录
      for (const record of jsonData) {
        // 查找或创建鸟类记录
        const [bird, created] = await Bird.findOrCreate({
          where: { scientificName: record.scientific_name },
          defaults: {
            cnCommon: record.cn_common,
            scientificName: record.scientific_name,
            commonName: record.common_name,
            orderName: record.order,
            family: record.family,
            genus: record.genus,
            species: record.species,
            subspecies: record.subspecies,
          }
        });
        
        if (created) {
          totalBirds++;
        }
        
        // 处理日期，如果日期无效则设为null
        let dateValue = null;
        if (record.date && record.date !== 'Invalid date') {
          dateValue = new Date(record.date);
          // 检查日期是否有效
          if (isNaN(dateValue.getTime())) {
            dateValue = null;
          }
        }
        
        // 创建录音记录
        await Recording.create({
          birdId: bird.id,
          type: record.type,
          sex: record.sex,
          stage: record.stage,
          recorder: record.recorder,
          country: record.country,
          region: record.region,
          license: record.license,
          duration: record.duration,
          sonoLarge: record.sono_large,
          sonoFull: record.sono_full,
          habitat: record.habitat,
          date: dateValue,
          lat: record.lat ? parseFloat(record.lat) : null,
          lng: record.lng ? parseFloat(record.lng) : null,
          quality: record.quality,
          url: record.url,
        });
        
        totalRecordings++;
      }
      
      console.log(`Finished processing ${file}`);
    }
    
    console.log(`Import completed successfully!`);
    console.log(`Total birds added: ${totalBirds}`);
    console.log(`Total recordings added: ${totalRecordings}`);
    
    // 关闭数据库连接
    await db.sequelize.close();
  } catch (error) {
    console.error('Error importing data:', error);
  }
}

// 运行导入脚本
importData();