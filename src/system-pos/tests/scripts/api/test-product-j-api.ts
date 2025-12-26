import fetch from 'node-fetch';

async function testProductJAPI() {
  // First, login to get a token
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0611', password: '1234' }),
  });
  
  const loginData = await loginRes.json();
  console.log('Login:', loginData.success ? 'Success' : 'Failed');
  
  if (!loginData.success) {
    console.log('Login error:', loginData);
    return;
  }
  
  const token = loginData.data.token;
  
  // Get product J
  const productRes = await fetch('http://localhost:3001/api/products/e3379ad9-c999-48f2-8c11-103e40d0de70', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const productData = await productRes.json();
  
  if (!productData.success) {
    console.log('Product fetch error:', productData);
    return;
  }
  
  const product = productData.data;
  console.log(`\n=== Product: ${product.name} (${product.sku}) ===\n`);
  
  console.log('Inventory entries:');
  product.inventory.forEach((inv: any) => {
    console.log(`  - Warehouse: ${inv.warehouse.name} (${inv.warehouse.type})`);
    console.log(`    Quantity: ${inv.quantity} (type: ${typeof inv.quantity})`);
    console.log(`    Quantity > 0: ${Number(inv.quantity) > 0}`);
    console.log(`    Warehouse ID: ${inv.warehouseId}`);
    console.log('');
  });
  
  // Test filtering logic
  const warehousesWithStock = product.inventory.filter((inv: any) => Number(inv.quantity) > 0);
  console.log(`\nWarehouses with stock: ${warehousesWithStock.length}`);
  warehousesWithStock.forEach((inv: any) => {
    console.log(`  - ${inv.warehouse.name}: ${inv.quantity} units`);
  });
}

testProductJAPI().catch(console.error);
