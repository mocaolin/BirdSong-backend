import db from '../models/index.js';

const Bird = db.Bird;
const Recording = db.Recording;

// 获取所有鸟类，支持分页和搜索
export const getAllBirds = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const search = req.query.search || '';
    
    const whereClause = search 
      ? {
          [db.Sequelize.Op.or]: [
            { cn_common: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { scientific_name: { [db.Sequelize.Op.iLike]: `%${search}%` } },
            { common_name: { [db.Sequelize.Op.iLike]: `%${search}%` } }
          ]
        }
      : {};
      
    const { count, rows } = await Bird.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['scientific_name', 'ASC']],
    });

    res.status(200).json({
      birds: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalBirds: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 根据ID获取特定鸟类详情及录音
export const getBirdById = async (req, res) => {
  try {
    const birdId = req.params.id;
    
    const bird = await Bird.findByPk(birdId, {
      include: [{
        model: Recording,
        as: 'recordings',
      }],
    });
    
    if (!bird) {
      return res.status(404).json({ message: 'Bird not found' });
    }
    
    res.status(200).json(bird);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 根据条件筛选鸟类
export const searchBirds = async (req, res) => {
  try {
    const { family, order, genus, country, quality } = req.query;
    
    const whereClause = {};
    
    if (family) whereClause.family = family;
    if (order) whereClause.order_name = order;
    if (genus) whereClause.genus = genus;
    
    let includeClause = [];
    
    if (country || quality) {
      const recordingWhere = {};
      if (country) recordingWhere.country = country;
      if (quality) recordingWhere.quality = quality;
      
      includeClause = [{
        model: Recording,
        as: 'recordings',
        where: recordingWhere,
        required: true,
      }];
    }
    
    const birds = await Bird.findAll({
      where: whereClause,
      include: includeClause,
    });
    
    res.status(200).json(birds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};