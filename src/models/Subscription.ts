import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database/connection';
import { Package } from './Package';
import { NotFoundError } from '../utils/errors';

// Interface for Subscription attributes
export interface SubscriptionAttributes {
  id: number;
  userId: number;
  packageId: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'cancelled' | 'expired';
  cancelledAt: Date | null;
}

// Interface for Subscription creation attributes
interface SubscriptionCreationAttributes
  extends Optional<SubscriptionAttributes, 'id' | 'cancelledAt'> {}

// Sequelize Model for Subscription
export class Subscription
  extends Model<SubscriptionAttributes, SubscriptionCreationAttributes>
  implements SubscriptionAttributes
{
  public id!: number;
  public userId!: number;
  public packageId!: number;
  public startDate!: Date;
  public endDate!: Date;
  public status!: 'active' | 'cancelled' | 'expired';
  public cancelledAt!: Date | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // --- Static Methods ---

  /**
   * Finds an existing subscription for a user and package.
   * @param userId The ID of the user.
   * @param packageId The ID of the package.
   */
  public static async findExisting(
    userId: number,
    packageId: number
  ): Promise<Subscription | null> {
    try {
      return await this.findOne({ 
        where: { 
          userId: userId, 
          packageId: packageId, 
          status: 'active' 
        } 
      });
    } catch (error) {
      console.error('Error in findExisting:', error);
      throw error;
    }
  }

  /**
   * Finds all subscriptions for a specific user.
   * @param userId The ID of the user.
   */
  public static async findAllByUser(userId: number): Promise<Subscription[]> {
    try {
      return await this.findAll({
        where: { userId: userId },
        include: [
          {
            model: Package,
            as: 'package',
            attributes: ['id', 'name', 'description'],
          },
        ],
      });
    } catch (error) {
      console.error('Error in findAllByUser:', error);
      throw error;
    }
  }

  /**
   * Finds a subscription by its ID and ensures it belongs to a specific user.
   * @param subscriptionId The ID of the subscription.
   * @param userId The ID of the user who should own the subscription.
   */
  public static async findByIdAndUser(subscriptionId: number, userId: number): Promise<Subscription> {
    try {
      const subscription = await this.findByPk(subscriptionId);
      if (!subscription || subscription.userId !== userId) {
        throw new NotFoundError('Subscription not found or you do not have permission to access it.');
      }
      return subscription;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error in findByIdAndUser:', error);
      throw error;
    }
  }
}

Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false,
    },
    packageId: {
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'expired'),
      allowNull: false,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'subscriptions',
    sequelize,
  }
);