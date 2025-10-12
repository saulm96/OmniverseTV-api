import { sequelize } from "./connection";
import { Package } from "../../models/Package";
import { User } from "../../models/User";
import { UserAuth } from "../../models/UserAuth"; 
import Channel from "../../models/Channel";
import "../../models/index";

const usersData = [
  {
    profile: {
      username: 'AdminUser',
      firstName: 'Admin',
      lastName: 'Omniverse',
      email: 'admin@omniverse.tv',
      preferred_language: 'en',
      role: 'admin',
    },
    auth: {
      password_hash: 'AdminPassword123!',
      auth_provider: 'local',
      is_verified: true,
    }
  },
  {
    profile: {
      username: 'RegularUser',
      firstName: 'Rick',
      lastName: 'Sanchez',
      email: 'user@omniverse.tv',
      preferred_language: 'es',
      role: 'user',
    },
    auth: {
      password_hash: 'UserPassword123!',
      auth_provider: 'local',
      is_verified: true,
    }
  },
] as const;

const packagesData = [
  {
    name: "Cosmic Comedy Central",
    description:
      "A package full of laughter from across the galaxies. Includes sitcoms from Dimension C-137.",
    price: 9.99,
  },
  {
    name: "Multiverse Mystery Mix",
    description:
      "For the detectives at heart. Unravel mysteries from alternate timelines and realities.",
    price: 12.99,
  },
  {
    name: "Interdimensional Sports League",
    description:
      "Catch live Blernsball games and the annual Gazorpazorpfield wrestling championship.",
    price: 15.99,
  },
];

const channelsData = [
  {
    name: "Giggle Galaxy TV",
    description: "24/7 stand-up from humanoid and non-humanoid comedians.",
    dimension_origin: "Dimension C-137",
  },
  {
    name: "The Prankverse",
    description:
      "Hidden camera shows featuring elaborate interdimensional pranks.",
    dimension_origin: "Dimension 42-J",
  },
  {
    name: "Noir Nebula Network",
    description:
      "Classic black and white detective stories from a rain-soaked reality.",
    dimension_origin: "Dimension Noir-7",
  },
  {
    name: "Clue Continuum",
    description:
      "Interactive mystery channel where viewers vote on the next clue.",
    dimension_origin: "Dimension ?-?",
  },
  {
    name: "Blernsball Bonanza",
    description: "The official home of the Universal Blernsball Association.",
    dimension_origin: "Dimension B-Ball",
  },
  {
    name: "Arena of the Gods",
    description:
      "Mythological figures competing in epic, world-altering sporting events.",
    dimension_origin: "Olympus-Prime",
  },
];

const seedDatabase = async () => {
  try {
    console.log("Starting database seeding...");
    console.log("Available models:", Object.keys(sequelize.models));

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");
    await sequelize.sync({ force: true });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("Database synchronized. Tables dropped and recreated.");

    const [createdPackages, createdChannels] = await Promise.all([
      Package.bulkCreate(packagesData),
      Channel.bulkCreate(channelsData),
    ]);
    console.log(`Created ${createdPackages.length} packages.`);
    console.log(`Created ${createdChannels.length} channels.`);

    console.log('Creating users and their auth data...');
    for (const userData of usersData) {
      const newUser = await User.create(userData.profile);
      
      await UserAuth.create({
        ...userData.auth,
        user_id: newUser.id,
        is_two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_temp_secret: null,
        verification_token: null,
        password_reset_token: null,
        password_reset_token_expires: null,
        email_change_token: null,
        email_change_token_expires: null,
        unconfirmed_email: null,
        provider_id: null,
        
      });
    }
    console.log(`Created ${usersData.length} users.`);

    await Promise.all([
      createdPackages[0].addChannels([createdChannels[0], createdChannels[1]]),
      createdPackages[1].addChannels([createdChannels[2], createdChannels[3]]),
      createdPackages[2].addChannels([createdChannels[4], createdChannels[5]]),
    ]);
    console.log("Channels associated with packages.");

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("Error during database seeding:", error);
  } finally {
    await sequelize.close();
    console.log("Database connection closed.");
  }
};

seedDatabase();