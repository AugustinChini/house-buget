const { db, runQuery } = require('../database');

async function migrateAddShowColumn() {
  try {
    console.log('Starting migration: Adding show column to categories table...');
    
    // Add show column to categories table
    await runQuery(`
      ALTER TABLE categories ADD COLUMN show INTEGER NOT NULL DEFAULT 1
    `);
    
    console.log('Migration completed successfully!');
    console.log('All existing categories are now visible by default.');
    
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('Column "show" already exists. Migration skipped.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    db.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateAddShowColumn();
}

module.exports = { migrateAddShowColumn }; 