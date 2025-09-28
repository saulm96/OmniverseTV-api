import {DataTypes, Model} from "sequelize";
import {sequelize} from "../database/connection";

//Define the User model interface
interface UserAttributes {
    id?: number;
    username: string;
    email: string;
    password_hash: string;
    preferred_language: string;
}

class User extends Model<UserAttributes> implements UserAttributes {
    public id! : number;
    public username!: string;
    public email!: string;
    public password_hash!: string;
    public preferred_language!: string;
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

  export default User;