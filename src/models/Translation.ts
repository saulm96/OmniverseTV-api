import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database/connection'; // <- Updated path

// Interface for Translation attributes
export interface TranslationAttributes {
  id: number;
  itemType: 'package' | 'channel';
  itemId: number;
  languageCode: string;
  translatedName: string;
  translatedDescription: string;
}

// Interface for Translation creation (id is optional)
interface TranslationCreationAttributes
  extends Optional<TranslationAttributes, 'id'> {}

// Sequelize Model for Translation
export class Translation
  extends Model<TranslationAttributes, TranslationCreationAttributes>
  implements TranslationAttributes
{
  public id!: number;
  public itemType!: 'package' | 'channel';
  public itemId!: number;
  public languageCode!: string;
  public translatedName!: string;
  public translatedDescription!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // --- Static Methods ---
  /**
   * Finds an existing translation for a specific item and language.
   * @param itemType - The type of item ('package' or 'channel').
   * @param itemId - The ID of the item.
   * @param languageCode - The language code (e.g., 'fr', 'es').
   */
  public static async findExisting(
    itemType: 'package' | 'channel',
    itemId: number,
    languageCode: string
  ): Promise<Translation | null> {
    return this.findOne({
      where: {
        itemType,
        itemId,
        languageCode,
      },
    });
  }
}

// Initialize the Translation model
Translation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    itemType: {
      type: DataTypes.ENUM('package', 'channel'),
      allowNull: false,
    },
    itemId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    languageCode: {
      type: new DataTypes.STRING(5), //'es', 'fr', 'en-US'
      allowNull: false,
    },
    translatedName: {
      type: new DataTypes.STRING(255),
      allowNull: false,
    },
    translatedDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'translations',
    sequelize,
    // Create a unique index to prevent duplicate translations
    indexes: [
      {
        unique: true,
        fields: ['itemType', 'itemId', 'languageCode'],
      },
    ],
  }
);

