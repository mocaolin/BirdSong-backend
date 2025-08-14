import app from './app.js';
import db from './models/index.js';

const PORT = process.env.PORT || 3000;

// 测试数据库连接
db.sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    
    // 同步数据库模型
    return db.sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database synchronized successfully.');
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });