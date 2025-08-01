const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database');

const router = express.Router();

// GET /api/expenses - Get all expenses with filtering
router.get('/', async (req, res) => {
  try {
    const {
      categoryId,
      type,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      search,
      tags,
      isRecurring,
      limit = 100,
      offset = 0
    } = req.query;
    
    let sql = `
      SELECT 
        e.id, e.title, e.amount, e.categoryId, e.date, e.type,
        e.paymentMethod, e.tags, e.isRecurring, e.recurringFrequency,
        e.createdAt, e.updatedAt,
        c.name as categoryName
      FROM expenses e
      LEFT JOIN categories c ON e.categoryId = c.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (categoryId) {
      conditions.push('e.categoryId = ?');
      params.push(categoryId);
    }
    
    if (type) {
      conditions.push('e.type = ?');
      params.push(type);
    }
    
    if (dateFrom) {
      conditions.push('e.date >= ?');
      params.push(dateFrom);
    }
    
    if (dateTo) {
      conditions.push('e.date <= ?');
      params.push(dateTo);
    }
    
    if (minAmount !== undefined) {
      conditions.push('e.amount >= ?');
      params.push(minAmount);
    }
    
    if (maxAmount !== undefined) {
      conditions.push('e.amount <= ?');
      params.push(maxAmount);
    }
    
    if (search) {
      conditions.push('(e.title LIKE ? OR e.paymentMethod LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (isRecurring !== undefined) {
      conditions.push('e.isRecurring = ?');
      params.push(isRecurring === 'true' ? 1 : 0);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY e.date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const expenses = await allQuery(sql, params);
    
    // Convert SQLite data to proper format
    let formattedExpenses = expenses.map(expense => ({
      ...expense,
      tags: expense.tags ? JSON.parse(expense.tags) : [],
      isRecurring: Boolean(expense.isRecurring),
      date: new Date(expense.date),
      createdAt: new Date(expense.createdAt),
      updatedAt: new Date(expense.updatedAt)
    }));
    
    // Filter by tags if specified
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      formattedExpenses = formattedExpenses.filter(expense => 
        expense.tags.some(tag => tagArray.includes(tag))
      );
    }
    
    res.json(formattedExpenses);
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await getQuery(
      `SELECT 
        e.*, c.name as categoryName
       FROM expenses e
       LEFT JOIN categories c ON e.categoryId = c.id
       WHERE e.id = ?`,
      [id]
    );
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Convert SQLite data to proper format
    const formattedExpense = {
      ...expense,
      tags: expense.tags ? JSON.parse(expense.tags) : [],
      isRecurring: Boolean(expense.isRecurring),
      date: new Date(expense.date),
      createdAt: new Date(expense.createdAt),
      updatedAt: new Date(expense.updatedAt)
    };
    
    res.json(formattedExpense);
  } catch (error) {
    console.error('Error getting expense:', error);
    res.status(500).json({ error: 'Failed to get expense' });
  }
});

// POST /api/expenses - Create new expense
router.post('/', async (req, res) => {
  try {
    const {
      title,
      amount,
      categoryId,
      date,
      type,
      paymentMethod,
      tags,
      isRecurring,
      recurringFrequency
    } = req.body;
    
    // Validation
    if (!title || !amount || !categoryId || !date || !type) {
      return res.status(400).json({ 
        error: 'Title, amount, categoryId, date, and type are required' 
      });
    }
    
    if (type !== 'expense' && type !== 'income') {
      return res.status(400).json({ error: 'Type must be either "expense" or "income"' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    
    // Check if category exists
    const category = await getQuery('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }
    
    const sql = `
      INSERT INTO expenses (
        title, amount, categoryId, date, type, paymentMethod, 
        tags, isRecurring, recurringFrequency, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    const result = await runQuery(sql, [
      title,
      amount,
      categoryId,
      date,
      type,
      paymentMethod || null,
      tags ? JSON.stringify(tags) : null,
      isRecurring ? 1 : 0,
      recurringFrequency || null
    ]);
    
    // Get the created expense
    const newExpense = await getQuery(
      `SELECT 
        e.*, c.name as categoryName
       FROM expenses e
       LEFT JOIN categories c ON e.categoryId = c.id
       WHERE e.id = ?`,
      [result.id]
    );
    
    const formattedExpense = {
      ...newExpense,
      tags: newExpense.tags ? JSON.parse(newExpense.tags) : [],
      isRecurring: Boolean(newExpense.isRecurring),
      date: new Date(newExpense.date),
      createdAt: new Date(newExpense.createdAt),
      updatedAt: new Date(newExpense.updatedAt)
    };
    
    res.status(201).json(formattedExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      amount,
      categoryId,
      date,
      type,
      paymentMethod,
      tags,
      isRecurring,
      recurringFrequency
    } = req.body;
    
    // Check if expense exists
    const existingExpense = await getQuery('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
      }
      updates.push('amount = ?');
      params.push(amount);
    }
    
    if (categoryId !== undefined) {
      // Check if category exists
      const category = await getQuery('SELECT * FROM categories WHERE id = ?', [categoryId]);
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
      updates.push('categoryId = ?');
      params.push(categoryId);
    }
    
    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }
    
    if (type !== undefined) {
      if (type !== 'expense' && type !== 'income') {
        return res.status(400).json({ error: 'Type must be either "expense" or "income"' });
      }
      updates.push('type = ?');
      params.push(type);
    }
    
    if (paymentMethod !== undefined) {
      updates.push('paymentMethod = ?');
      params.push(paymentMethod);
    }
    
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(tags ? JSON.stringify(tags) : null);
    }
    
    if (isRecurring !== undefined) {
      updates.push('isRecurring = ?');
      params.push(isRecurring ? 1 : 0);
    }
    
    if (recurringFrequency !== undefined) {
      updates.push('recurringFrequency = ?');
      params.push(recurringFrequency);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`;
    await runQuery(sql, params);
    
    // Get the updated expense
    const updatedExpense = await getQuery(
      `SELECT 
        e.*, c.name as categoryName
       FROM expenses e
       LEFT JOIN categories c ON e.categoryId = c.id
       WHERE e.id = ?`,
      [id]
    );
    
    const formattedExpense = {
      ...updatedExpense,
      tags: updatedExpense.tags ? JSON.parse(updatedExpense.tags) : [],
      isRecurring: Boolean(updatedExpense.isRecurring),
      date: new Date(updatedExpense.date),
      createdAt: new Date(updatedExpense.createdAt),
      updatedAt: new Date(updatedExpense.updatedAt)
    };
    
    res.json(formattedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if expense exists
    const existingExpense = await getQuery('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    await runQuery('DELETE FROM expenses WHERE id = ?', [id]);
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// GET /api/expenses/type/:type - Get expenses by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type !== 'expense' && type !== 'income') {
      return res.status(400).json({ error: 'Type must be either "expense" or "income"' });
    }
    
    const expenses = await allQuery(
      `SELECT 
        e.*, c.name as categoryName
       FROM expenses e
       LEFT JOIN categories c ON e.categoryId = c.id
       WHERE e.type = ?
       ORDER BY e.date DESC`,
      [type]
    );
    
    // Convert SQLite data to proper format
    const formattedExpenses = expenses.map(expense => ({
      ...expense,
      tags: expense.tags ? JSON.parse(expense.tags) : [],
      isRecurring: Boolean(expense.isRecurring),
      date: new Date(expense.date),
      createdAt: new Date(expense.createdAt),
      updatedAt: new Date(expense.updatedAt)
    }));
    
    res.json(formattedExpenses);
  } catch (error) {
    console.error('Error getting expenses by type:', error);
    res.status(500).json({ error: 'Failed to get expenses by type' });
  }
});

// GET /api/expenses/month/:year/:month - Get expenses by month
router.get('/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const expenses = await allQuery(
      `SELECT 
        e.*, c.name as categoryName
       FROM expenses e
       LEFT JOIN categories c ON e.categoryId = c.id
       WHERE strftime('%Y', e.date) = ? AND strftime('%m', e.date) = ?
       ORDER BY e.date DESC`,
      [year, month.padStart(2, '0')]
    );
    
    // Convert SQLite data to proper format
    const formattedExpenses = expenses.map(expense => ({
      ...expense,
      tags: expense.tags ? JSON.parse(expense.tags) : [],
      isRecurring: Boolean(expense.isRecurring),
      date: new Date(expense.date),
      createdAt: new Date(expense.createdAt),
      updatedAt: new Date(expense.updatedAt)
    }));
    
    res.json(formattedExpenses);
  } catch (error) {
    console.error('Error getting expenses by month:', error);
    res.status(500).json({ error: 'Failed to get expenses by month' });
  }
});

// GET /api/expenses/summary - Get expense summary
router.get('/summary', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (dateFrom || dateTo) {
      const conditions = [];
      if (dateFrom) {
        conditions.push('date >= ?');
        params.push(dateFrom);
      }
      if (dateTo) {
        conditions.push('date <= ?');
        params.push(dateTo);
      }
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
    
    const summary = await getQuery(
      `SELECT 
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expenseCount,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as incomeCount,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        AVG(CASE WHEN type = 'expense' THEN amount END) as averageExpense,
        AVG(CASE WHEN type = 'income' THEN amount END) as averageIncome
       FROM expenses
       ${whereClause}`,
      params
    );
    
    const result = {
      totalExpenses: summary.totalExpenses || 0,
      totalIncome: summary.totalIncome || 0,
      netAmount: (summary.totalIncome || 0) - (summary.totalExpenses || 0),
      expenseCount: summary.expenseCount || 0,
      incomeCount: summary.incomeCount || 0,
      averageExpense: summary.averageExpense || 0,
      averageIncome: summary.averageIncome || 0
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error getting expense summary:', error);
    res.status(500).json({ error: 'Failed to get expense summary' });
  }
});

// GET /api/expenses/recurring - Get recurring expenses
router.get('/recurring', async (req, res) => {
  try {
    const expenses = await allQuery(
      `SELECT 
        e.*, c.name as categoryName
       FROM expenses e
       LEFT JOIN categories c ON e.categoryId = c.id
       WHERE e.isRecurring = 1
       ORDER BY e.date DESC`
    );
    
    // Convert SQLite data to proper format
    const formattedExpenses = expenses.map(expense => ({
      ...expense,
      tags: expense.tags ? JSON.parse(expense.tags) : [],
      isRecurring: Boolean(expense.isRecurring),
      date: new Date(expense.date),
      createdAt: new Date(expense.createdAt),
      updatedAt: new Date(expense.updatedAt)
    }));
    
    res.json(formattedExpenses);
  } catch (error) {
    console.error('Error getting recurring expenses:', error);
    res.status(500).json({ error: 'Failed to get recurring expenses' });
  }
});

module.exports = router; 