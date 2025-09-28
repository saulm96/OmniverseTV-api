import {User} from './User';
import {Package} from './Package';
import Channel from './Channel';
import Subscription from './Subscription';
import Translation from './Translation';

// ---- Model Relationships ----

// User -> Subscription (One-to-Many)
User.hasMany(Subscription, {
  foreignKey: 'userId',
  as: 'subscriptions',
});
Subscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Package -> Subscription (One-to-Many)
Package.hasMany(Subscription, {
  foreignKey: 'packageId',
  as: 'subscriptions',
});
Subscription.belongsTo(Package, {
  foreignKey: 'packageId',
  as: 'package',
});

// Package <-> Channel (Many-to-Many)
Package.belongsToMany(Channel, {
  through: 'PackageChannels', // Junction table
  as: 'channels',
  foreignKey: 'packageId',
  timestamps: false,
});
Channel.belongsToMany(Package, {
  through: 'PackageChannels',
  as: 'packages',
  foreignKey: 'channelId',
  timestamps: false,
});

// ---- Polymorphic Relationships for Translations ----

// A Package can have many Translations
Package.hasMany(Translation, {
  foreignKey: 'item_id',
  constraints: false, // Required for polymorphic associations
  scope: {
    item_type: 'package',
  },
  as: 'translations',
});

// A Channel can have many Translations
Channel.hasMany(Translation, {
  foreignKey: 'item_id',
  constraints: false, // Required for polymorphic associations
  scope: {
    item_type: 'channel',
  },
  as: 'translations',
});

// Export all defined models
export { User, Package, Channel, Subscription, Translation };

