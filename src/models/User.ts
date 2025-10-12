import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database/connection";

export interface UserAttributes {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  preferred_language: string;
  profile_image_url?: string | null;
  role: "user" | "admin";
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  // --- Database Attributes ---
  public id!: number;
  public username!: string;
  public firstName!: string | null;
  public lastName!: string | null;
  public email!: string;
  public preferred_language!: string;
  public profile_image_url!: string | null;
  public role!: "user" | "admin";


  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

}

//Initialize the model
User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    preferred_language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profile_image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
  },
  {
    sequelize,
    modelName: "User",
    paranoid: true,
  }
);
