import {DataTypes, Model, Optional} from "sequelize";
import {sequelize} from "../database/connection";
import bcrypt from "bcrypt";

//Define the User model interface
export interface UserAttributes {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    preferred_language: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  // --- Atributos de la Base de Datos ---
  public id!: number;
  public username!: string;
  public email!: string;
  public password_hash!: string;
  public preferred_language!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  public static findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
}

//Initialize the model
User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      preferred_language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'en',
      },
    },
    {
      sequelize,
      modelName: 'User',
      timestamps: false, 
    }
  );

