# CocoaChain API Documentation

## Overview
The CocoaChain API is a Node.js/Express server that interfaces with the Ethereum smart contract to track cocoa sales and seller information.

## Server Setup

### Prerequisites
- Node.js v16 or higher
- Running Ethereum node (local Hardhat node or testnet)
- Deployed CocoaChain smart contract

### Installation & Running

```bash
# Install dependencies
npm install

# Start the API server
npm start

# For development with auto-reload
npm run dev
```

The server runs on `http://localhost:3001` by default.

---

## API Endpoints

### 1. **GET /** - API Information
Returns available endpoints and API version.

```bash
curl http://localhost:3001/
```

**Response:**
```json
{
  "message": "CocoaChain API v1.0 is running",
  "endpoints": {
    "GET /": "API info",
    "POST /register": "Register as seller",
    "POST /sale": "Record a sale",
    "GET /sales": "Get all sales",
    "GET /seller/:sellerId": "Get seller details",
    "GET /sales-summary": "Get sales statistics",
    "GET /blockchain": "Get blockchain info"
  }
}
```

---

### 2. **POST /register** - Register as Seller
Auto-generates a unique seller ID based on wallet address and registers the seller on the smart contract.

```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "sellerId": "SELLER_CF7ED3AC",
  "walletAddress": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  "transactionHash": "0x1234...",
  "message": "Seller registered successfully"
}
```

**Seller ID Generation:**
- Format: `SELLER_XXXXXXXX`
- Based on first 7 characters of wallet address (hexadecimal)
- Automatically generated and unique per wallet

---

### 3. **POST /sale** - Record a Sale
Records a new sale transaction on the smart contract. Supports multiple sales per seller.

```bash
curl -X POST http://localhost:3001/sale \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "SELLER_CF7ED3AC",
    "buyerName": "John Doe",
    "quantityKg": 100,
    "price": 50
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sellerId` | string | Yes | Seller ID from registration |
| `buyerName` | string | Yes | Name of the buyer |
| `quantityKg` | number | Yes | Quantity in kilograms (must be > 0) |
| `price` | number | Yes | Price per kilogram (must be > 0) |

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x5678...",
  "message": "Sale recorded successfully",
  "data": {
    "sellerId": "SELLER_CF7ED3AC",
    "buyerName": "John Doe",
    "quantityKg": 100,
    "price": 50
  }
}
```

**Error Responses:**
```json
// Missing fields
{
  "error": "Missing required fields",
  "required": ["sellerId", "buyerName", "quantityKg", "price"]
}

// Invalid seller
{
  "error": "Seller SELLER_INVALID is not registered. Please register first."
}

// Invalid quantity or price
{
  "error": "quantityKg must be a positive number"
}
```

---

### 4. **GET /sales** - Get All Sales
Retrieves all sales recorded on the blockchain.

```bash
curl http://localhost:3001/sales
```

**Response:**
```json
{
  "success": true,
  "totalSales": 3,
  "sales": [
    {
      "saleId": "1",
      "sellerId": "SELLER_CF7ED3AC",
      "buyerName": "John Doe",
      "quantityKg": "100",
      "price": "50",
      "timestamp": "2026-01-27T10:30:45.000Z"
    },
    {
      "saleId": "2",
      "sellerId": "SELLER_AB12CD34",
      "buyerName": "Jane Smith",
      "quantityKg": "75",
      "price": "55",
      "timestamp": "2026-01-27T11:15:30.000Z"
    }
  ]
}
```

---

### 5. **GET /seller/:sellerId** - Get Seller Details
Retrieves detailed information about a specific seller including stats and recent sales.

```bash
curl http://localhost:3001/seller/SELLER_CF7ED3AC
```

**Response:**
```json
{
  "success": true,
  "seller": {
    "sellerId": "SELLER_CF7ED3AC",
    "walletAddress": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    "totalSales": "2",
    "totalQuantity": "175",
    "totalRevenue": "8750"
  },
  "salesCount": 2,
  "recentSales": [
    {
      "saleId": "1",
      "buyerName": "John Doe",
      "quantityKg": "100",
      "price": "50",
      "timestamp": "2026-01-27T10:30:45.000Z"
    }
  ]
}
```

---

### 6. **GET /blockchain** - Get Blockchain Info
Retrieves overall blockchain statistics.

```bash
curl http://localhost:3001/blockchain
```

**Response:**
```json
{
  "success": true,
  "blockchain": {
    "totalSales": "5",
    "totalSellers": "2",
    "totalCocoaSold": "250",
    "contractAddress": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  }
}
```

---

### 7. **GET /sales-summary** - Get Sales Summary
Retrieves comprehensive sales statistics including top sellers.

```bash
curl http://localhost:3001/sales-summary
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalSales": 5,
    "totalSellers": 2,
    "totalCocoaSold": 250,
    "totalRevenue": 12500,
    "averagePricePerKg": "50.00"
  },
  "topSellers": [
    {
      "sellerId": "SELLER_CF7ED3AC",
      "sales": 3,
      "quantity": 150,
      "revenue": 7500
    },
    {
      "sellerId": "SELLER_AB12CD34",
      "sales": 2,
      "quantity": 100,
      "revenue": 5000
    }
  ]
}
```

---

### 8. **GET /mine** - Mining Info
Information about the mining process (Ethereum uses Proof of Stake).

```bash
curl http://localhost:3001/mine
```

**Response:**
```json
{
  "message": "Mining is automatic on-chain with smart contract.",
  "note": "Ethereum uses Proof of Stake, not Proof of Work for block validation"
}
```

---

## Smart Contract Integration

### Contract Address
The API connects to the deployed CocoaChain smart contract. The address is configured in the environment:
- Default: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- Override: Set `CONTRACT_ADDRESS` environment variable

### Key Functions Used

| Function | Purpose |
|----------|---------|
| `registerSeller()` | Register a seller and get auto-generated ID |
| `recordSaleMultiple()` | Record a sale (allows multiple per seller) |
| `getSalesCount()` | Get total number of sales |
| `getSale(index)` | Get sale by index |
| `getSellerDetails(sellerId)` | Get seller information |
| `getSellerSales(sellerId)` | Get all sales for a seller |
| `isSellerRegistered(sellerId)` | Check if seller is registered |

---

## Error Handling

The API returns standard HTTP status codes:

| Status | Meaning |
|--------|---------|
| `200` | Successful request |
| `400` | Bad request (validation error) |
| `500` | Server error (contract error or not initialized) |

**Common Error Messages:**

```json
// Contract not initialized
{
  "error": "Contract not initialized. Deploy the contract first."
}

// Invalid inputs
{
  "error": "Missing required fields",
  "required": ["sellerId", "buyerName", "quantityKg", "price"]
}

// Seller not registered
{
  "error": "Seller SELLER_INVALID is not registered. Please register first."
}
```

---

## Usage Examples

### Complete Workflow

#### 1. Register as a Seller
```bash
curl -X POST http://localhost:3001/register
```

#### 2. Record a Sale
```bash
curl -X POST http://localhost:3001/sale \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "SELLER_ABC123",
    "buyerName": "Buyer Name",
    "quantityKg": 50,
    "price": 25
  }'
```

#### 3. Check Your Sales
```bash
curl http://localhost:3001/seller/SELLER_ABC123
```

#### 4. View Summary
```bash
curl http://localhost:3001/sales-summary
```

---

## Configuration

### Environment Variables

```bash
# Contract address (optional)
export CONTRACT_ADDRESS=0xYourContractAddress

# RPC Provider (optional)
export RPC_URL=http://127.0.0.1:8545

# Port (optional)
export PORT=3001
```

### Default Settings

- **RPC Provider**: `http://127.0.0.1:8545` (local Hardhat node)
- **Port**: `3001`
- **CORS**: Enabled for all origins

---

## Testing the API

### Using cURL

```bash
# Check API status
curl http://localhost:3001/

# Register seller
curl -X POST http://localhost:3001/register

# Record a sale
curl -X POST http://localhost:3001/sale \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId":"SELLER_TEST",
    "buyerName":"Test Buyer",
    "quantityKg":10,
    "price":5
  }'
```

### Using Postman

1. Create a new collection "CocoaChain API"
2. Add requests for each endpoint
3. Save seller ID from register response
4. Use seller ID in subsequent requests

---

## Troubleshooting

### Contract Not Initialized
**Problem**: "Contract not initialized" error

**Solution**:
1. Ensure Hardhat node is running: `npx hardhat node`
2. Deploy contract: `npx hardhat run scripts/deploy.js --network localhost`
3. Update `CONTRACT_ADDRESS` with deployed address
4. Restart API server

### Seller Not Registered
**Problem**: "Seller not registered" error

**Solution**:
1. Call `POST /register` endpoint first
2. Use the returned `sellerId` in sale requests

### Transaction Failed
**Problem**: Transaction reverts with cryptic error

**Solution**:
1. Check all required fields are provided
2. Verify seller is registered
3. Ensure quantityKg and price are positive numbers
4. Check available gas in wallet

---

## Performance Notes

- Blockchain queries are read-only and fast
- Recording sales involves a blockchain transaction (slower, ~5-30 seconds)
- Use `recordSaleMultiple()` for unlimited sales per seller
- Consider batching multiple sales if applicable

---

## Support & Documentation

For more information:
- Smart Contract: See `CocoaChain.sol`
- Integration Guide: See `INTEGRATION_GUIDE.md`
- Quick Reference: See `QUICK_REFERENCE.md`

