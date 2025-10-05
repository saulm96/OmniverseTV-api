import {DataTypes, Model, Optional} from "sequelize";
import {sequelize} from "../config/database/connection";
import bcrypt from "bcrypt";

export interface UserAttributes {
    id: number;
    username: string;
    email: string;
    password_hash: string | null; 
    preferred_language: string;

    // --- OAUTH FIELDS ---
    auth_provider: 'local' | 'google'; 
    provider_id?: string | null; 
    is_verified: boolean; 
    verification_token?: string | null; 
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  // --- Database Attributes ---
  public id!: number;
  public username!: string;
  public email!: string;
  public password_hash!: string | null; 
  public preferred_language!: string;
  public auth_provider!: 'local' | 'google'; 
  public provider_id!: string | null; 
  public is_verified!: boolean; 
  public verification_token!: string | null; 

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // --- INSTANCE METHODS ---

  /**
   * Compares a candidate password with the user's hashed password.
   * @param candidatePassword The password to compare.
   * @returns A promise that resolves to true if the passwords match, false otherwise.
   */
  public comparePassword(candidatePassword: string): Promise<boolean> {
    // A user logged in with Google won't have a password_hash
    if (!this.password_hash) {
        return Promise.resolve(false);
    }
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  // --- CLASS METHODS ---

  /**
   * Finds a user by their email address.
   * @param email The email to search for.
   * @returns A promise that resolves to the User instance or null if not found.
   */
  public static findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
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
        allowNull: true, 
      },
      preferred_language: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // --- OAUTH FIELDS ---
      auth_provider: {
        type: DataTypes.ENUM('local', 'google'),
        allowNull: false,
        defaultValue: 'local',
      },
      provider_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verification_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      hooks: {
        // This hook only runs if a password is provided
        beforeCreate: async (user) => {
          if (user.password_hash) {
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(user.password_hash, salt);
          }
        },
      },
    }
);