import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database/connection";
import { User } from "./User";
import bcrypt from "bcrypt";

export interface UserAuthAttributes {
  id: number;
  password_hash: string | null;
  auth_provider: "local" | "google";
  provider_id: string | null;
  is_verified: boolean;
  verification_token: string | null;
  password_reset_token: string | null;
  password_reset_token_expires: Date | null;

  unconfirmed_email: string | null;
  email_change_token: string | null;
  email_change_token_expires: Date | null;

  is_two_factor_enabled: boolean;
  two_factor_secret: string | null;
  two_factor_temp_secret: string | null;

  user_id: number;

  
}

interface UserAuthCreationAttributes
  extends Optional<UserAuthAttributes, "id"> {}

export class UserAuth
  extends Model<UserAuthAttributes, UserAuthCreationAttributes>
  implements UserAuthAttributes
{
  public id!: number;
  public password_hash!: string | null;
  public auth_provider!: "local" | "google";
  public provider_id!: string | null;
  public is_verified!: boolean;
  public verification_token!: string | null;
  public password_reset_token!: string | null;
  public password_reset_token_expires!: Date | null;
  public email_change_token!: string | null;
  public email_change_token_expires!: Date | null;
  public unconfirmed_email!: string | null;
  public is_two_factor_enabled!: boolean;
  public two_factor_secret!: string | null;
  public two_factor_temp_secret!: string | null;
  public user_id!: number;

  public readonly user?: User;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

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
}

UserAuth.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    password_hash: { type: DataTypes.STRING, allowNull: true },
    auth_provider: {
      type: DataTypes.ENUM("local", "google"),
      allowNull: false,
      defaultValue: "local",
    },
    provider_id: { type: DataTypes.STRING, allowNull: true, unique: true },
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_reset_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_change_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email_change_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unconfirmed_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    two_factor_secret: { type: DataTypes.STRING, allowNull: true },
    two_factor_temp_secret: { type: DataTypes.STRING, allowNull: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
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
    modelName: "UserAuth",
    tableName: "UserAuths",
    timestamps: true,
    hooks: {
        beforeCreate: async (userAuth) => {
            if (userAuth.password_hash) {
                const salt = await bcrypt.genSalt(10);
                userAuth.password_hash = await bcrypt.hash(userAuth.password_hash, salt);
            }
        },
        beforeUpdate: async (userAuth) => {
            if (userAuth.changed("password_hash") && userAuth.password_hash) {
                const isAlreadyHashed =
                    userAuth.password_hash.startsWith("$2a$") ||
                    userAuth.password_hash.startsWith("$2b$");
                if (!isAlreadyHashed) {
                    const salt = await bcrypt.genSalt(10);
                    userAuth.password_hash = await bcrypt.hash(userAuth.password_hash, salt);
                }
            }
        },
    }
  }
);
