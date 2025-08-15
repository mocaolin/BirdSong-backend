import db from '../src/models/index.js';

console.log('Syncing database...');

db.sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  });