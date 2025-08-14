import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import config from '../config/database.js';

dotenv.config();

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

let sequelize;
if (config[env].use_env_variable) {
  sequelize = new Sequelize(process.env[config[env].use_env_variable], config[env]);
} else {
  sequelize = new Sequelize(
    config[env].database, 
    config[env].username, 
    config[env].password, 
    config[env]
  );
}

const db = {};

// 动态导入所有模型文件
const modelFiles = fs.readdirSync(__dirname).filter(file => {
  return (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js' &&
    file.indexOf('.test.js') === -1
  );
});

// 导入所有模型
for (const file of modelFiles) {
  const modelPath = path.join(__dirname, file);
  const model = await import(modelPath);
  const modelDef = model.default(sequelize, DataTypes);
  db[modelDef.name] = modelDef;
}

// 建立模型关联
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;