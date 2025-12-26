import fetch from 'node-fetch';

async function testAPI() {
  // Login first
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0611', password: '1234' }),
  });
  
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('Login failed:', loginData);
    return;
  }
  
  const token = loginData.data.token;
  console.log('✓ Login successful\n');
  
  // Get product J
  const productRes = await fetch('http://localhost:3001/api/products/e3379ad9-c999-48f2-8c11-103e40d0de70', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const productData = await productRes.json();
  
  if (!productData.success) {
    console.error('Product fetch failed:', productData);
    return;
  }
  
  const product = productData.data;
  console.log(`=== Product: ${product.name} ===\n`);
  console.log('Inventory entries:');
  
  product.inventory.forEach((inv: any, index: number) => {
    const qty = typeof inv.quantity === 'number' ? inv.quantity : Number(inv.quantity) || 0;
    console.log(`[${index}] ${inv.warehouse.name} (${inv.warehouse.type}):`);
    console.log(`  - Quantity: ${inv.quantity} (type: ${typeof inv.quantity})`);
    console.log(`  - Converted: ${qty}`);
    console.log(`  - Has stock: ${qty > 0}`);
    console.log('');
  });
  
  // Test filtering logic
  const warehousesWithStock = product.inventory.filter((inv: any) => {
    const qty = typeof inv.quantity === 'number' ? inv.quantity : Number(inv.quantity) || 0;
    return qty > 0;
  });
  
  console.log(`\nWarehouses with stock: ${warehousesWithStock.length}`);
  warehousesWithStock.forEach((inv: any) => {
    const qty = typeof inv.quantity === 'number' ? inv.quantity : Number(inv.quantity) || 0;
    console.log(`  - ${inv.warehouse.name}: ${qty} units`);
  });
}

testAPI().catch(console.error);
