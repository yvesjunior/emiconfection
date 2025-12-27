# Adding Test IDs for E2E Testing

This guide shows how to add `testID` props to components so Detox can find and interact with them.

## 📋 Quick Reference

Add `testID` to these component types:
- `View` → `testID="screen-name"`
- `TextInput` → `testID="input-name"`
- `TouchableOpacity` / `Pressable` → `testID="button-name"`
- `FlatList` → `testID="list-name"`
- `ScrollView` → `testID="scroll-view-name"`

## 🔧 Examples

### Login Screen (`app/login.tsx`)

```tsx
<KeyboardAvoidingView testID="login-screen" style={styles.container}>
  <View style={styles.content}>
    {/* Phone Input */}
    <TextInput
      testID="phone-input"
      value={phone}
      onChangeText={handlePhoneChange}
      placeholder="Numéro de téléphone"
    />
    
    {/* PIN Input */}
    <TextInput
      testID="pin-input"
      value={pin}
      onChangeText={handlePinChange}
      secureTextEntry
      placeholder="PIN"
    />
    
    {/* Login Button */}
    <TouchableOpacity
      testID="login-button"
      onPress={() => handleLogin(phone, pin)}
    >
      <Text>Se connecter</Text>
    </TouchableOpacity>
  </View>
</KeyboardAvoidingView>
```

### POS Screen (`app/(app)/index.tsx`)

```tsx
<SafeAreaView testID="pos-screen" style={styles.container}>
  {/* Product List */}
  <FlatList
    testID="product-list"
    data={products}
    renderItem={({ item, index }) => (
      <TouchableOpacity
        testID={`product-item-${index}`}
        onPress={() => handleProductPress(item)}
      >
        <Text>{item.name}</Text>
      </TouchableOpacity>
    )}
  />
  
  {/* Cart Tab */}
  <TouchableOpacity
    testID="cart-tab"
    onPress={() => router.push('/(app)/cart')}
  >
    <Text>Panier ({cartItemCount})</Text>
  </TouchableOpacity>
</SafeAreaView>
```

### Cart Screen (`app/(app)/cart.tsx`)

```tsx
<SafeAreaView testID="cart-screen" style={styles.container}>
  <FlatList
    testID="cart-items-list"
    data={cartItems}
    renderItem={({ item, index }) => (
      <View testID={`cart-item-${index}`}>
        <Text>{item.product.name}</Text>
      </View>
    )}
  />
  
  <TouchableOpacity
    testID="checkout-button"
    onPress={handleCheckout}
  >
    <Text>Valider la commande</Text>
  </TouchableOpacity>
</SafeAreaView>
```

## 📝 Priority Components to Update

1. **Login Screen** (`app/login.tsx`)
   - `login-screen`
   - `phone-input`
   - `pin-input`
   - `login-button`

2. **POS Screen** (`app/(app)/index.tsx`)
   - `pos-screen`
   - `product-list`
   - `product-item-{index}`
   - `cart-tab`

3. **Cart Screen** (`app/(app)/cart.tsx`)
   - `cart-screen`
   - `cart-items-list`
   - `checkout-button`

4. **Inventory Screen** (`app/(app)/inventory.tsx`)
   - `inventory-screen`
   - `inventory-list`
   - `inventory-item-{index}`

5. **Transfer Requests** (`app/(app)/transfer-requests-list.tsx`)
   - `transfers-screen`
   - `transfer-requests-list`
   - `transfer-request-item-{index}`

## 🚀 Next Steps

1. Add testIDs to components listed above
2. Run `npm run e2e:ios` or `npm run e2e:android`
3. Tests will automatically find elements by testID

