import {DataTypes, Model, Optional} from "sequelize";
import {sequelize} from "../config/database/connection";
import bcrypt from "bcrypt";

/**
 * User model attributes
 * 
 * @example
 * ```typescript
 * const userAttrs: UserAttributes = {
 *   id: 1,
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   password_hash: '$2b$10$...',
 *   preferred_language: 'es'
 * };
 * ```
 */
export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  preferred_language: string;
}

/**
 * Attributes required for user creation (id is auto-generated)
 */
interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

/**
 * User model with authentication capabilities
 * 
 * @remarks
 * - Passwords are automatically hashed with bcrypt (10 salt rounds)
 * - Email validation is enforced
 * - Username and email must be unique
 * 
 * @example
 * Creating a new user
 * ```typescript
 * const user = await User.create({
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   password_hash: 'plainPassword123',
 *   preferred_language: 'es'
 * });
 * ```
 * 
 * @example
 * Authenticating a user
 * ```typescript
 * const user = await User.findByEmail('john@example.com');
 * if (user && await user.comparePassword('plainPassword123')) {
 *   console.log('Authentication successful');
 * }
 * ```
 */
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password_hash!: string;
  public preferred_language!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Compares a plain text password with the stored hash
   * 
   * @param candidatePassword - Plain text password to verify
   * @returns True if password matches, false otherwise
   * 
   * @example
   * ```typescript
   * const isValid = await user.comparePassword('myPassword123');
   * ```
   */
  public comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  /**
   * Finds a user by email address
   * 
   * @param email - Email address to search for
   * @returns User instance or null if not found
   * 
   * @example
   * ```typescript
   * const user = await User.findByEmail('john@example.com');
   * ```
   */
  public static findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
}

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
      allowNull: false,
    },
    preferred_language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
    },
  }
);