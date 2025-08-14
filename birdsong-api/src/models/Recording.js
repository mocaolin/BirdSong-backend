const Recording = (sequelize, DataTypes) => {
  const Recording = sequelize.define('Recording', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    birdId: {
      type: DataTypes.INTEGER,
      field: 'bird_id',
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
    },
    sex: {
      type: DataTypes.STRING,
    },
    stage: {
      type: DataTypes.STRING,
    },
    recorder: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.STRING,
    },
    region: {
      type: DataTypes.TEXT,
    },
    license: {
      type: DataTypes.TEXT,
    },
    duration: {
      type: DataTypes.STRING,
    },
    sonoLarge: {
      type: DataTypes.TEXT,
      field: 'sono_large',
    },
    sonoFull: {
      type: DataTypes.TEXT,
      field: 'sono_full',
    },
    habitat: {
      type: DataTypes.TEXT,
    },
    date: {
      type: DataTypes.DATE,
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
    },
    lng: {
      type: DataTypes.DECIMAL(11, 8),
    },
    quality: {
      type: DataTypes.STRING(10), // 增加长度以适应更长的quality值
    },
    url: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'recordings',
    timestamps: true,
    underscored: true,
  });

  Recording.associate = (models) => {
    Recording.belongsTo(models.Bird, {
      foreignKey: 'birdId',
      as: 'bird',
    });
  };

  return Recording;
};

export default Recording;