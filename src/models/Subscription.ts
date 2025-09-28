import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../database/connection';

type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

interface SubscriptionAttributes {
  id?: number;
  start_date: Date;
  end_date: Date;
  status: SubscriptionStatus;
  userId?: number;
  packageId?: number;
}

class Subscription extends Model<SubscriptionAttributes> implements SubscriptionAttributes {
  public id!: number;
  public start_date!: Date;
  public end_date!: Date;
  public status!: SubscriptionStatus;
}

Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'Subscription',
    timestamps: false,
  }
);

export default Subscription;
