const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${method} ${endpoint} - Success`);
      return data;
    } else {
      console.log(`❌ ${method} ${endpoint} - Error: ${data.error}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Network Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing Budget App API...\n');

  // Test health check
  console.log('1. Testing health check...');
  await testEndpoint('/health');
  console.log('');

  // Test categories
  console.log('2. Testing categories...');
  const categories = await testEndpoint('/categories');
  
  if (categories && categories.length > 0) {
    const firstCategory = categories[0];
    console.log(`   Found ${categories.length} categories`);
    
    // Test get category by ID
    await testEndpoint(`/categories/${firstCategory.id}`);
    
    // Test get expenses by category
    await testEndpoint(`/categories/${firstCategory.id}/expenses`);
  }
  console.log('');

  // Test expenses
  console.log('3. Testing expenses...');
  const expenses = await testEndpoint('/expenses');
  
  if (expenses && expenses.length > 0) {
    console.log(`   Found ${expenses.length} expenses`);
    
    const firstExpense = expenses[0];
    // Test get expense by ID
    await testEndpoint(`/expenses/${firstExpense.id}`);
  }
  console.log('');

  // Test expense filters
  console.log('4. Testing expense filters...');
  await testEndpoint('/expenses/type/expense');
  await testEndpoint('/expenses/type/income');
  await testEndpoint('/expenses/recurring');
  console.log('');

  // Test summary
  console.log('5. Testing summary...');
  await testEndpoint('/expenses/summary');
  console.log('');

  // Test month filter
  console.log('6. Testing month filter...');
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  await testEndpoint(`/expenses/month/${year}/${month}`);
  console.log('');

  console.log('🎉 API testing completed!');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, testEndpoint }; 