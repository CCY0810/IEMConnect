/**
 * Utility to prevent Sequelize from automatically syncing schema
 * This should be imported early in the application to ensure
 * Sequelize never tries to create indexes automatically
 * 
 * NOTE: Basic sync protection is already in database.js
 * This function adds additional protection for model-level sync
 */

import sequelize from "../config/database.js";

/**
 * Explicitly disable all Sequelize sync operations
 * This prevents automatic index creation that causes duplicate indexes
 * 
 * This is called AFTER models are loaded to protect model-level sync
 */
export const preventAutoSync = () => {
  // Prevent individual model sync (called after models are loaded)
  const models = Object.values(sequelize.models || {});
  models.forEach(model => {
    if (model && model.sync) {
      const originalModelSync = model.sync;
      model.sync = function(options = {}) {
        console.warn(
          `[MODEL SYNC BLOCKED] Automatic sync for model ${model.name} is disabled. Use migrations instead.`
        );
        
        if (process.env.NODE_ENV === 'development' && options.force === true) {
          console.warn(`[WARNING] Force sync enabled for ${model.name}`);
          return originalModelSync.call(this, options);
        }
        
        return Promise.resolve();
      };
    }
  });

  console.log("[SYNC PROTECTION] Model-level sync protection enabled");
};

export default preventAutoSync;

