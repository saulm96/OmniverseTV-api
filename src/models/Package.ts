import {
  Model,
  DataTypes,
  Optional,
  BelongsToManyAddAssociationsMixin,
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

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // --- Association methods ---
  public addChannels!: BelongsToManyAddAssociationsMixin<Channel, number[]>;
  public getChannels!: BelongsToManyGetAssociationsMixin<Channel>;

  // --- Static Methods ---
  /**
   * Finds a package by its primary key.
   * Does NOT include associated channels.
   * @param id The ID of the package.
   */
  public static async findById(id: number): Promise<Package | null> {
    return this.findByPk(id);
  }

  /**
   * Finds a package by its primary key, including its associated channels.
   * @param id The ID of the package.
   */
  public static async findByIdWithChannels(id: number): Promise<Package | null> {
    return this.findByPk(id, {
      include: {
        model: Channel,
        as: 'channels',
        through: { attributes: [] }, // Hides the join table attributes
      },
    });
  }

  /**
   * Finds all packages.
   */
  public static async findAllPackages(): Promise<Package[]> {
    return this.findAll();
  }
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
    sequelize,
  }
);

