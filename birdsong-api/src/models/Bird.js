const Bird = (sequelize, DataTypes) => {
  const Bird = sequelize.define('Bird', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cnCommon: {
      type: DataTypes.STRING,
      field: 'cn_common',
    },
    scientificName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'scientific_name',
    },
    commonName: {
      type: DataTypes.STRING,
      field: 'common_name',
    },
    orderName: {
      type: DataTypes.STRING,
      field: 'order_name',
    },
    family: {
      type: DataTypes.STRING,
    },
    genus: {
      type: DataTypes.STRING,
    },
    species: {
      type: DataTypes.STRING,
    },
    subspecies: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'birds',
    timestamps: true,
    underscored: true,
  });

  Bird.associate = (models) => {
    Bird.hasMany(models.Recording, {
      foreignKey: 'birdId',
      as: 'recordings',
    });
  };

  return Bird;
};

export default Bird;