const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database');

const router = express.Router();

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const { isActive, show, search } = req.query;
    
    let sql = `
      SELECT 
        id, name, budget, color, icon, description, 
        isActive, show, createdAt, updatedAt
      FROM categories
    `;
    
    const params = [];
    const conditions = [];
    
    if (isActive !== undefined) {
      conditions.push('isActive = ?');
      params.push(isActive === 'true' ? 1 : 0);
    }
    
    if (show !== undefined) {
      conditions.push('show = ?');
      params.push(show === 'true' ? 1 : 0);
    }
    
    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY name ASC';
    
    const categories = await allQuery(sql, params);
    
    // Convert SQLite boolean to JavaScript boolean
    const formattedCategories = categories.map(category => ({
      ...category,
      isActive: Boolean(category.isActive),
      show: Boolean(category.show),
      createdAt: new Date(category.createdAt),
      updatedAt: new Date(category.updatedAt)
    }));
    
    res.json(formattedCategories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await getQuery(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Convert SQLite boolean to JavaScript boolean
    const formattedCategory = {
      ...category,
      isActive: Boolean(category.isActive),
      show: Boolean(category.show),
      createdAt: new Date(category.createdAt),
      updatedAt: new Date(category.updatedAt)
    };
    
    res.json(formattedCategory);
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// POST /api/categories - Create new category
router.post('/', async (req, res) => {
  try {
    const { name, budget, color, icon, description } = req.body;
    
    // Validation
    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }
    
    if (budget < 0) {
      return res.status(400).json({ error: 'Budget cannot be negative' });
    }
    
    const sql = `
      INSERT INTO categories (name, budget, color, icon, description, isActive, show, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    const result = await runQuery(sql, [name, budget || 0, color, icon || null, description || null]);
    
    // Get the created category
    const newCategory = await getQuery('SELECT * FROM categories WHERE id = ?', [result.id]);
    
    const formattedCategory = {
      ...newCategory,
      isActive: Boolean(newCategory.isActive),
      show: Boolean(newCategory.show),
      createdAt: new Date(newCategory.createdAt),
      updatedAt: new Date(newCategory.updatedAt)
    };
    
    res.status(201).json(formattedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, budget, color, icon, description, isActive, show } = req.body;
    
    // Check if category exists
    const existingCategory = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (budget !== undefined) {
      if (budget < 0) {
        return res.status(400).json({ error: 'Budget cannot be negative' });
      }
      updates.push('budget = ?');
      params.push(budget);
    }
    
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (isActive !== undefined) {
      updates.push('isActive = ?');
      params.push(isActive ? 1 : 0);
    }
    
    if (show !== undefined) {
      updates.push('show = ?');
      params.push(show ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sql = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;
    await runQuery(sql, params);
    
    // Get the updated category
    const updatedCategory = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
    
    const formattedCategory = {
      ...updatedCategory,
      isActive: Boolean(updatedCategory.isActive),
      show: Boolean(updatedCategory.show),
      createdAt: new Date(updatedCategory.createdAt),
      updatedAt: new Date(updatedCategory.updatedAt)
    };
    
    res.json(formattedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const existingCategory = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has associated expenses
    const expenseCount = await getQuery(
      'SELECT COUNT(*) as count FROM expenses WHERE categoryId = ?',
      [id]
    );
    
    if (expenseCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with associated expenses. Please delete or reassign expenses first.' 
      });
    }
    
    await runQuery('DELETE FROM categories WHERE id = ?', [id]);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// GET /api/categories/:id/expenses - Get expenses by category
router.get('/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const expenses = await allQuery(
      'SELECT * FROM expenses WHERE categoryId = ? ORDER BY date DESC',
      [id]
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
    console.error('Error getting expenses by category:', error);
    res.status(500).json({ error: 'Failed to get expenses by category' });
  }
});

module.exports = router; 