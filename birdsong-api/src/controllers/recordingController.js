import db from '../models/index.js';

const Recording = db.Recording;
const Bird = db.Bird;

// 获取所有录音，支持筛选和分页
export const getAllRecordings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { type, country, quality, dateFrom, dateTo } = req.query;
    
    const whereClause = {};
    
    if (type) whereClause.type = { [db.Sequelize.Op.iLike]: `%${type}%` };
    if (country) whereClause.country = country;
    if (quality) whereClause.quality = quality;
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date[db.Sequelize.Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.date[db.Sequelize.Op.lte] = new Date(dateTo);
    }
    
    const { count, rows } = await Recording.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['date', 'DESC']],
      include: [{
        model: Bird,
        as: 'bird',
        attributes: ['id', 'cnCommon', 'scientificName', 'commonName']
      }]
    });

    res.status(200).json({
      recordings: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalRecordings: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 根据ID获取特定录音详情
export const getRecordingById = async (req, res) => {
  try {
    const recordingId = req.params.id;
    
    const recording = await Recording.findByPk(recordingId, {
      include: [{
        model: Bird,
        as: 'bird',
      }],
    });
    
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }
    
    res.status(200).json(recording);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};