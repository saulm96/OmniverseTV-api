import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

interface PackageAttributes {
  id?: number;
  name: string;
  description: string;
  price: number;
}

class Package extends Model<PackageAttributes> implements PackageAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
}

Package.init(
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
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Package',
    timestamps: false,
  }
);

export default Package;
