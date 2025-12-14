const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "data", "budget.db");

// Create database directory if it doesn't exist
const fs = require("fs");
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create categories table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          budget REAL NOT NULL DEFAULT 0,
          color TEXT NOT NULL,
          icon TEXT,
          description TEXT,
          isActive INTEGER NOT NULL DEFAULT 1,
          show INTEGER NOT NULL DEFAULT 1,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating categories table:", err.message);
            reject(err);
          }
        }
      );

      // Add show column to existing categories table if it doesn't exist
      db.run(
        `
        ALTER TABLE categories ADD COLUMN show INTEGER NOT NULL DEFAULT 1
      `,
        (err) => {
          // Ignore error if column already exists
          if (err && !err.message.includes("duplicate column name")) {
            console.error("Error adding show column:", err.message);
          }
        }
      );

      // Create expenses table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          categoryId INTEGER NOT NULL,
          date DATETIME NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
          paymentMethod TEXT,
          tags TEXT,
          isRecurring INTEGER DEFAULT 0,
          recurringFrequency TEXT CHECK(recurringFrequency IN ('daily', 'weekly', 'monthly', 'yearly')),
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating expenses table:", err.message);
            reject(err);
          } else {
            console.log("Database tables created successfully");
            resolve();
          }
        }
      );

      // Create auth_tokens table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS auth_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT UNIQUE NOT NULL,
          expiresAt DATETIME NOT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating auth_tokens table:", err.message);
          }
        }
      );

      // Create indexes for better performance
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_categories_isActive ON categories(isActive)"
      );
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)"
      );
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_expenses_categoryId ON expenses(categoryId)"
      );
      db.run("CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type)");
      db.run("CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)");
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_expenses_isRecurring ON expenses(isRecurring)"
      );
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token)"
      );
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_auth_tokens_expiresAt ON auth_tokens(expiresAt)"
      );
    });
  });
};

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  db,
  initDatabase,
  runQuery,
  getQuery,
  allQuery,
};
