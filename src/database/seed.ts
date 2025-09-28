import { sequelize } from './connection';
import { Package } from '../models/Package';
import Channel from '../models/Channel';
import { Subscription } from '../models/Subscription'; // Asegúrate de importar Subscription
import '../models/index'; // Importar el archivo de asociaciones

// Sample data for seeding
const packagesData = [
  {
    name: 'Cosmic Comedy Central',
    description:
      'A package full of laughter from across the galaxies. Includes sitcoms from Dimension C-137.',
    price: 9.99,
  },
  {
    name: 'Multiverse Mystery Mix',
    description:
      'For the detectives at heart. Unravel mysteries from alternate timelines and realities.',
    price: 12.99,
  },
  {
    name: 'Interdimensional Sports League',
    description:
      'Catch live Blernsball games and the annual Gazorpazorpfield wrestling championship.',
    price: 15.99,
  },
];

const channelsData = [
  // Comedy Channels
  {
    name: 'Giggle Galaxy TV',
    description: '24/7 stand-up from humanoid and non-humanoid comedians.',
    dimension_origin: 'Dimension C-137',
  },
  {
    name: 'The Prankverse',
    description:
      'Hidden camera shows featuring elaborate interdimensional pranks.',
    dimension_origin: 'Dimension 42-J',
  },

  // Mystery Channels
  {
    name: 'Noir Nebula Network',
    description:
      'Classic black and white detective stories from a rain-soaked reality.',
    dimension_origin: 'Dimension Noir-7',
  },
  {
    name: 'Clue Continuum',
    description:
      'Interactive mystery channel where viewers vote on the next clue.',
    dimension_origin: 'Dimension ?-?',
  },

  // Sports Channels
  {
    name: 'Blernsball Bonanza',
    description: 'The official home of the Universal Blernsball Association.',
    dimension_origin: 'Dimension B-Ball',
  },
  {
    name: 'Arena of the Gods',
    description:
      'Mythological figures competing in epic, world-altering sporting events.',
    dimension_origin: 'Olympus-Prime',
  },
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Verificar que todos los modelos estén cargados
    console.log('Available models:', Object.keys(sequelize.models));

    // Manually drop tables in the correct order to avoid foreign key constraints
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Forzar la sincronización - esto recreará todas las tablas basándose en los modelos
    await sequelize.sync({ force: true });
    
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('Database synchronized. Tables dropped and recreated.');

    // Verificar que la tabla subscriptions tenga la columna cancelledAt
    const [results] = await sequelize.query('DESCRIBE subscriptions;');
    console.log('Subscriptions table structure:', results);

    // Create Packages
    const createdPackages = await Package.bulkCreate(packagesData);
    console.log(`Created ${createdPackages.length} packages.`);

    // Create Channels
    const createdChannels = await Channel.bulkCreate(channelsData);
    console.log(`Created ${createdChannels.length} channels.`);

    // Associate Channels with Packages
    await Promise.all([
      createdPackages[0].addChannels([createdChannels[0], createdChannels[1]]), // Comedy
      createdPackages[1].addChannels([createdChannels[2], createdChannels[3]]), // Mystery
      createdPackages[2].addChannels([createdChannels[4], createdChannels[5]]), // Sports
    ]);

    console.log('Channels associated with packages.');

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
};

seedDatabase();