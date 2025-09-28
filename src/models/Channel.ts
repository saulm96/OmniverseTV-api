import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

interface ChannelAttributes {
  id?: number;
  name: string;
  description: string;
  dimension_origin: string;
}

class Channel extends Model<ChannelAttributes> implements ChannelAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public dimension_origin!: string;
}

Channel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dimension_origin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Channel',
    timestamps: false,
  }
);

export default Channel;
