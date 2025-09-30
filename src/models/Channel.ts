import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database/connection';

// Interface for Channel attributes
export interface ChannelAttributes {
  id: number;
  name: string;
  description: string;
  dimension_origin: string;
}

// Interface for Channel creation attributes (id is optional)
interface ChannelCreationAttributes extends Optional<ChannelAttributes, 'id'> {}

// Sequelize Model for Channel
export class Channel
  extends Model<ChannelAttributes, ChannelCreationAttributes>
  implements ChannelAttributes
{
  public id!: number;
  public name!: string;
  public description!: string;
  public dimension_origin!: string;

  // --- Static Methods ---
  /**
   * Finds a channel by its primary key.
   * @param id The ID of the channel.
   */
  public static async findById(id: number): Promise<Channel | null> {
    return this.findByPk(id);
  }
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
