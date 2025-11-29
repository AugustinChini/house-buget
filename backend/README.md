# Budget App Backend

A Node.js REST API backend for the Budget App, built with Express.js and SQLite.

## Features

- **Categories Management**: CRUD operations for budget categories
- **Expenses Management**: CRUD operations for expenses and income
- **Advanced Filtering**: Filter expenses by category, type, date range, amount, etc.
- **Summary Statistics**: Get expense summaries and analytics
- **Recurring Expenses**: Support for recurring expenses with different frequencies
- **SQLite Database**: Lightweight, file-based database
- **RESTful API**: Clean, RESTful endpoints
- **Error Handling**: Comprehensive error handling and validation

## API Endpoints

### Categories

- `GET /api/categories` - Get all categories (with optional filtering)
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `GET /api/categories/:id/expenses` - Get expenses by category

### Expenses

- `GET /api/expenses` - Get all expenses (with advanced filtering)
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/type/:type` - Get expenses by type (expense/income)
- `GET /api/expenses/month/:year/:month` - Get expenses by month
- `GET /api/expenses/summary` - Get expense summary statistics
- `GET /api/expenses/recurring` - Get recurring expenses

### Health Check

- `GET /api/health` - Health check endpoint

## Installation

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Initialize the database with sample data:

   ```bash
   npm run init-db
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001` by default.

## Environment Variables

Copy `env.example` to `.env` and configure as needed:

```bash
cp env.example .env
```

Available variables:

- `PORT` - Server port (default: 3001)
- `JSON_BODY_LIMIT` - Maximum size accepted by `express.json`/`urlencoded` (default: 10mb)

## Database Schema

### Categories Table

- `id` - Primary key (auto-increment)
- `name` - Category name
- `budget` - Monthly budget amount
- `color` - Category color (hex)
- `icon` - Category icon (emoji)
- `description` - Category description
- `isActive` - Whether category is active
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Expenses Table

- `id` - Primary key (auto-increment)
- `title` - Expense title
- `amount` - Expense amount
- `categoryId` - Foreign key to categories
- `date` - Expense date
- `type` - 'expense' or 'income'
- `paymentMethod` - Payment method used
- `tags` - JSON array of tags
- `isRecurring` - Whether expense is recurring
- `recurringFrequency` - 'daily', 'weekly', 'monthly', or 'yearly'
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## API Usage Examples

### Create a Category

```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Groceries",
    "budget": 400,
    "color": "#FF6B6B",
    "icon": "🛒",
    "description": "Food and household items"
  }'
```

### Create an Expense

```bash
curl -X POST http://localhost:3001/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Grocery Shopping",
    "amount": 85.50,
    "categoryId": 1,
    "date": "2024-01-15T10:00:00.000Z",
    "type": "expense",
    "paymentMethod": "Credit Card",
    "tags": ["groceries", "food"]
  }'
```

### Get Expenses with Filtering

```bash
curl "http://localhost:3001/api/expenses?categoryId=1&type=expense&dateFrom=2024-01-01&dateTo=2024-01-31"
```

### Get Expense Summary

```bash
curl "http://localhost:3001/api/expenses/summary?dateFrom=2024-01-01&dateTo=2024-01-31"
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Running in Production Mode

```bash
npm start
```

### Database Reset

To reset the database and reinitialize with sample data:

```bash
rm data/budget.db
npm run init-db
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a descriptive message:

```json
{
  "error": "Category not found"
}
```

## CORS Configuration

The API is configured to accept requests from any origin in development. For production, you may want to restrict this by setting the `CORS_ORIGIN` environment variable.

## Security

- Input validation on all endpoints
- SQL injection protection through parameterized queries
- Helmet.js for security headers
- CORS protection

## License

MIT
