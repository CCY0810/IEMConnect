import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const sequelize = new Sequelize(
  process.env.DB_NAME || "IEM_CONNECT",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    // TiDB Cloud SSL configuration
    dialectOptions: process.env.DB_HOST?.includes('tidbcloud.com') ? {
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    } : {},
    // CRITICAL: Disable all automatic schema synchronization
    // Indexes should ONLY be created via migrations
    define: {
      // Prevent Sequelize from automatically creating indexes
      // All indexes must be created via SQL migrations
      freezeTableName: true, // Don't pluralize table names
      timestamps: true, // Use timestamps (but don't auto-create indexes on them)
    },
    // Disable automatic table/index creation
    sync: false, // Explicitly disable sync
  }
);

// CRITICAL: Override sync methods BEFORE any models are loaded
// This prevents Sequelize from automatically creating indexes
const originalSync = sequelize.sync;
sequelize.sync = function(options = {}) {
  console.warn(
    "[SEQUELIZE SYNC BLOCKED] " +
    "Automatic schema synchronization is disabled. " +
    "Use migrations to modify the database schema. " +
    "If you need to sync, explicitly set force: true and alter: true (NOT RECOMMENDED IN PRODUCTION)"
  );
  
  // Only allow sync if explicitly forced (for development/testing)
  if (process.env.NODE_ENV === 'development' && options.force === true && options.alter === true) {
    console.warn("[WARNING] Force sync enabled - this will recreate all tables!");
    return originalSync.call(this, options);
  }
  
  // Otherwise, just return a resolved promise without doing anything
  return Promise.resolve();
};

export default sequelize;
