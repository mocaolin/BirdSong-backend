import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import birdsRouter from './routes/birds.js';
import recordingsRouter from './routes/recordings.js';

dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/birds', birdsRouter);
app.use('/api/recordings', recordingsRouter);

// 基础路由
app.get('/', (req, res) => {
  res.json({ 
    message: 'BirdSong API', 
    version: '1.0.0',
    endpoints: {
      birds: '/api/birds',
      recordings: '/api/recordings'
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app;