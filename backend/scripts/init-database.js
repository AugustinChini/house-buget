const { initDatabase, runQuery } = require('../database');

const sampleCategories = [
  {
    name: 'Food & Dining',
    budget: 500,
    color: '#FF6B6B',
    icon: '🍽️',
    description: 'Restaurants, groceries, and dining out'
  },
  {
    name: 'Transportation',
    budget: 200,
    color: '#4ECDC4',
    icon: '🚗',
    description: 'Gas, public transport, and car maintenance'
  },
  {
    name: 'Entertainment',
    budget: 150,
    color: '#45B7D1',
    icon: '🎬',
    description: 'Movies, games, and leisure activities'
  },
  {
    name: 'Shopping',
    budget: 300,
    color: '#96CEB4',
    icon: '🛍️',
    description: 'Clothing, electronics, and general shopping'
  },
  {
    name: 'Utilities',
    budget: 250,
    color: '#FFEAA7',
    icon: '⚡',
    description: 'Electricity, water, internet, and phone bills'
  },
  {
    name: 'Healthcare',
    budget: 100,
    color: '#DDA0DD',
    icon: '🏥',
    description: 'Medical expenses and health-related costs'
  },
  {
    name: 'Salary',
    budget: 0,
    color: '#98D8C8',
    icon: '💰',
    description: 'Regular income from employment',
    isActive: false
  },
  {
    name: 'Freelance',
    budget: 0,
    color: '#F7DC6F',
    icon: '💼',
    description: 'Additional income from freelance work',
    isActive: false
  }
];

const sampleExpenses = [
  {
    title: 'Grocery Shopping',
    amount: 85.50,
    categoryId: 1,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    type: 'expense',
    paymentMethod: 'Credit Card',
    tags: ['groceries', 'food']
  },
  {
    title: 'Gas Station',
    amount: 45.00,
    categoryId: 2,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    type: 'expense',
    paymentMethod: 'Debit Card',
    tags: ['transportation', 'gas']
  },
  {
    title: 'Movie Tickets',
    amount: 24.00,
    categoryId: 3,
    date: new Date(),
    type: 'expense',
    paymentMethod: 'Credit Card',
    tags: ['entertainment', 'movies']
  },
  {
    title: 'Monthly Salary',
    amount: 3500.00,
    categoryId: 7,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    type: 'income',
    paymentMethod: 'Direct Deposit',
    tags: ['salary', 'income']
  },
  {
    title: 'Electricity Bill',
    amount: 120.00,
    categoryId: 5,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    type: 'expense',
    paymentMethod: 'Bank Transfer',
    tags: ['utilities', 'bills'],
    isRecurring: true,
    recurringFrequency: 'monthly'
  },
  {
    title: 'Freelance Project',
    amount: 500.00,
    categoryId: 8,
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    type: 'income',
    paymentMethod: 'PayPal',
    tags: ['freelance', 'income']
  }
];

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Initialize database tables
    await initDatabase();
    console.log('Database tables created successfully');
    
    // Check if sample data already exists
    const existingCategories = await require('../database').allQuery('SELECT COUNT(*) as count FROM categories');
    const existingExpenses = await require('../database').allQuery('SELECT COUNT(*) as count FROM expenses');
    
    if (existingCategories[0].count > 0 || existingExpenses[0].count > 0) {
      console.log('Sample data already exists. Skipping data insertion.');
      return;
    }
    
    console.log('Inserting sample categories...');
    
    // Insert sample categories
    for (const category of sampleCategories) {
      const sql = `
        INSERT INTO categories (name, budget, color, icon, description, isActive, show, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      
      await runQuery(sql, [
        category.name,
        category.budget,
        category.color,
        category.icon,
        category.description,
        category.isActive !== false ? 1 : 0
      ]);
    }
    
    console.log('Inserting sample expenses...');
    
    // Insert sample expenses
    for (const expense of sampleExpenses) {
      const sql = `
        INSERT INTO expenses (
          title, amount, categoryId, date, type, paymentMethod, 
          tags, isRecurring, recurringFrequency, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      
      await runQuery(sql, [
        expense.title,
        expense.amount,
        expense.categoryId,
        expense.date.toISOString(),
        expense.type,
        expense.paymentMethod,
        expense.tags ? JSON.stringify(expense.tags) : null,
        expense.isRecurring ? 1 : 0,
        expense.recurringFrequency || null
      ]);
    }
    
    console.log('Database initialized successfully with sample data!');
    console.log(`Created ${sampleCategories.length} categories and ${sampleExpenses.length} expenses`);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('Database initialization completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase }; 