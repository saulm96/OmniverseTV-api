import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database/connection";
import {User} from './User';

export interface RecoveryCodeAttributes {
  id: number;
  code: string;
  is_used: boolean;
  user_id: number;
}

interface RecoveryCodeCreationAttributes
  extends Optional<RecoveryCodeAttributes, "id"> {}

export class RecoveryCode
  extends Model<RecoveryCodeAttributes, RecoveryCodeCreationAttributes>
  implements RecoveryCodeAttributes
{
  public id!: number;
  public code!: string;
  public is_used!: boolean;
  public user_id!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RecoveryCode.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "RecoveryCode",
    tableName: "RecoveryCodes",
  }
);
