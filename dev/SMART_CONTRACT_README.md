# CocoaChain Smart Contract Documentation

## Overview
The `CocoaChain` smart contract is a Solidity-based decentralized cocoa trading platform built on Ethereum. It provides transparent, immutable record-keeping for cocoa sales transactions with built-in verification mechanisms.

## Features

### 1. **Sale Recording**
- Record cocoa sales with seller ID, buyer name, quantity, and price
- Automatically calculates total price
- Prevents duplicate sales from the same seller in a single transaction block
- Emits events for transparency

### 2. **Seller Profiles**
- Automatic seller registration on first sale
- Tracks total quantity sold
- Tracks total revenue generated
- Maintains sales count
- Seller status (active/inactive)

### 3. **Buyer Profiles**
- Automatic buyer registration on first purchase
- Tracks total quantity purchased
- Tracks total amount spent
- Maintains purchase history count

### 4. **Quality Verification**
- Designated verifiers can approve sales
- Verification tracking for each sale
- Owner can add/remove verifiers

### 5. **Analytics & Reporting**
- Get top sellers by revenue
- View all active sellers and buyers
- Contract statistics (total sales, cocoa quantity, revenue)
- Individual sale and profile lookups

## Smart Contract Structure

### State Variables
```solidity
address public owner                          // Contract owner
uint256 public totalSales                    // Total number of sales recorded
uint256 public totalCocoaQuantity           // Total cocoa traded (in Kg)
uint256 public totalRevenue                 // Total revenue (in wei)

mapping(address => SellerProfile) sellers   // Seller data by address
mapping(string => BuyerProfile) buyers      // Buyer data by name
mapping(uint256 => Sale) sales              // Sale data by ID
mapping(address => bool) verifiers          // Authorized verifiers
```

### Main Structures

#### Sale
```solidity
struct Sale {
    address seller              // Seller wallet address
    string sellerId            // Seller ID string
    string buyerName           // Buyer name
    uint256 quantityKg         // Quantity in kilograms
    uint256 pricePerUnit       // Price per unit
    uint256 totalPrice         // Total transaction price
    uint256 timestamp          // Block timestamp
    bool verified              // Verification status
}
```

#### SellerProfile
```solidity
struct SellerProfile {
    string sellerId            // Seller identifier
    uint256 totalSalesQuantity // Total Kg sold
    uint256 totalRevenue       // Total revenue earned
    uint256 salesCount         // Number of sales
    bool active                // Active status
}
```

#### BuyerProfile
```solidity
struct BuyerProfile {
    string buyerName           // Buyer name
    uint256 totalPurchaseQuantity  // Total Kg purchased
    uint256 totalSpent         // Total amount spent
    uint256 purchaseCount      // Number of purchases
}
```

## Core Functions

### Public Functions

#### `recordSale()`
```solidity
function recordSale(
    string memory _sellerId,
    string memory _buyerName,
    uint256 _quantityKg,
    uint256 _pricePerUnit
) external validSale returns (uint256)
```
- Records a new cocoa sale transaction
- Returns: Sale ID
- Automatically registers seller/buyer if new
- Updates all relevant statistics

#### `verifySale()`
```solidity
function verifySale(uint256 _saleId) external onlyVerifier
```
- Marks a sale as verified by authorized verifier
- Only verifiers or owner can call
- Emits `SaleVerified` event

#### `getTopSellers()`
```solidity
function getTopSellers(uint256 _limit) external view returns (address[], uint256[])
```
- Returns top sellers by revenue
- Sorted in descending order
- Limited by _limit parameter

#### `getStatistics()`
```solidity
function getStatistics() external view returns (uint256, uint256, uint256, uint256, uint256, uint256)
```
Returns:
- Total sales count
- Total cocoa quantity (Kg)
- Total revenue
- Active sellers count
- Active buyers count
- Verified sales count

### Owner Functions

#### `addVerifier()`
```solidity
function addVerifier(address _verifier) external onlyOwner
```
- Authorizes a new verifier address

#### `removeVerifier()`
```solidity
function removeVerifier(address _verifier) external onlyOwner
```
- Revokes verifier authorization

## Events

### SaleRecorded
```solidity
event SaleRecorded(
    uint256 indexed saleId,
    address indexed seller,
    string sellerId,
    string buyerName,
    uint256 quantityKg,
    uint256 totalPrice,
    uint256 timestamp
)
```

### SaleVerified
```solidity
event SaleVerified(
    uint256 indexed saleId,
    address indexed verifier,
    uint256 timestamp
)
```

### SellerRegistered
```solidity
event SellerRegistered(
    address indexed sellerAddress,
    string sellerId,
    uint256 timestamp
)
```

### BuyerRegistered
```solidity
event BuyerRegistered(
    string buyerName,
    uint256 timestamp
)
```

## Modifiers

### `onlyOwner`
- Restricts function execution to contract owner

### `onlyVerifier`
- Restricts function execution to authorized verifiers or owner

### `validSale`
- Ensures quantity and price are greater than 0

## Deployment

### Prerequisites
- Solidity compiler version ^0.8.0
- Ethereum wallet with deployment funds
- Web3 provider (Infura, Alchemy, local node, etc.)

### Networks Supported
- Ethereum Mainnet
- Sepolia Testnet (recommended for testing)
- Polygon (EVM-compatible)
- Other EVM-compatible chains

### Deployment Steps

1. **Using Hardhat:**
```bash
npm install --save-dev hardhat @openzeppelin/contracts
npx hardhat init
# Copy CocoaChain.sol to contracts/
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

2. **Using Remix IDE:**
- Go to https://remix.ethereum.org
- Create new file: `CocoaChain.sol`
- Paste contract code
- Compile and deploy

3. **Using Truffle:**
```bash
npm install -g truffle
truffle init
# Copy CocoaChain.sol to contracts/
truffle compile
truffle migrate --network sepolia
```

## Usage Examples

### Record a Sale (Web3.js)
```javascript
const contract = new web3.eth.Contract(ABI, contractAddress);
const saleId = await contract.methods.recordSale(
    "SELLER001",
    "Buyer Corp",
    100,  // 100 Kg
    5000  // $50 per unit
).send({ from: sellerAddress });
```

### Verify a Sale
```javascript
await contract.methods.verifySale(saleId).send({ from: verifierAddress });
```

### Get Top Sellers
```javascript
const [sellers, revenues] = await contract.methods.getTopSellers(5).call();
console.log("Top 5 sellers by revenue:", sellers, revenues);
```

### Get Statistics
```javascript
const stats = await contract.methods.getStatistics().call();
console.log("Total Sales:", stats._totalSales);
console.log("Total Revenue:", stats._totalRevenue);
console.log("Active Sellers:", stats._activeSellersCount);
```

## Security Considerations

1. **Reentrancy**: Contract doesn't handle ETH transfers, avoiding reentrancy issues
2. **Input Validation**: All inputs validated via modifiers
3. **Access Control**: Owner and verifier roles for sensitive operations
4. **Data Integrity**: Immutable transaction records on blockchain
5. **Gas Efficiency**: Optimized for reasonable gas costs

## Gas Estimates

| Function | Gas Cost |
|----------|----------|
| recordSale | ~120,000 |
| verifySale | ~35,000 |
| addVerifier | ~25,000 |
| getTopSellers (5) | ~15,000 (view) |
| getStatistics | ~12,000 (view) |

## Future Enhancements

1. **Payment Integration**: Accept ETH or stablecoins for automated payments
2. **NFT Certificates**: Issue NFT certificates for verified sales
3. **DAO Governance**: Decentralized governance for platform rules
4. **Oracle Integration**: Real-time cocoa price feeds
5. **Multi-signature**: Multi-sig for critical operations
6. **Batch Operations**: Bulk sale recording for efficiency
7. **Dispute Resolution**: Arbitration mechanism for sale disputes

## License
MIT License - See contract header for details

## Support
For issues or questions, contact: [your-contact-info]
