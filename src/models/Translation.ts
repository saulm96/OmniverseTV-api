import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

type ItemType = 'package' | 'channel';

interface TranslationAttributes {
  id?: number;
  item_type: ItemType;
  item_id: number;
  language_code: string;
  field: string;
  translated_text: string;
}

class Translation extends Model<TranslationAttributes> implements TranslationAttributes {
  public id!: number;
  public item_type!: ItemType;
  public item_id!: number;
  public language_code!: string;
  public field!: string;
  public translated_text!: string;
}

Translation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    item_type: {
      type: DataTypes.ENUM('package', 'channel'),
      allowNull: false,
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    language_code: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    field: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    translated_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Translation',
    timestamps: false,
    // Create a composite index to optimize translation searches
    indexes: [
      {
        unique: true,
        fields: ['item_type', 'item_id', 'language_code', 'field'],
      },
    ],
  }
);

export default Translation;
