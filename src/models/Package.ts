import {
  Model,
  DataTypes,
  Optional,
  BelongsToManyAddAssociationsMixin, // Correct type for adding multiple associations
  BelongsToManyGetAssociationsMixin,
} from 'sequelize';
import { sequelize } from '../database/connection';
import Channel from './Channel';

// Interface for Package attributes
export interface PackageAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
}

// Interface for Package creation attributes (id is optional)
interface PackageCreationAttributes extends Optional<PackageAttributes, 'id'> {}

// Sequelize Model for Package
export class Package
  extends Model<PackageAttributes, PackageCreationAttributes>
  implements PackageAttributes
{
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  //TODO: We will delete the timeStamps in the future if we don't need them
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // --- Association methods ---
  // These are injected by Sequelize after associations are defined.
  // We declare them here to make TypeScript aware of them.
  public addChannels!: BelongsToManyAddAssociationsMixin<Channel, number>; // Use plural form here
  public getChannels!: BelongsToManyGetAssociationsMixin<Channel>;
}

// Initialize Package model
Package.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: 'packages',
    sequelize, // We need to pass the connection instance
  }
);

