# CocoaChain Integration Guide

## Overview
This guide explains how to integrate the Solidity smart contract with your existing JavaScript blockchain and frontend.

## Project Structure
```
cocoa-chain/
├── dev/
│   ├── blockchain.js              (Current custom blockchain)
│   ├── verinetworkNode.js         (Express API server)
│   ├── package.json
│   ├── CocoaChain.sol             (NEW: Smart contract)
│   ├── deploy.js                  (NEW: Deployment script)
│   ├── hardhat.config.js          (NEW: Hardhat config)
│   └── SMART_CONTRACT_README.md   (NEW: Contract docs)
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── ...
```

## Setup Instructions

### 1. Install Hardhat & Dependencies

```bash
cd /Users/best/Desktop/Debbie/cocoa-chain/dev

npm install --save-dev \
  hardhat \
  @nomicfoundation/hardhat-toolbox \
  @nomiclabs/hardhat-ethers \
  @nomiclabs/hardhat-etherscan \
  hardhat-gas-reporter \
  @openzeppelin/contracts \
  dotenv

npm install ethers web3
```

### 2. Set Up Environment Variables

Create `.env` file in the `dev/` directory:

```env
# Sepolia Testnet
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here

# Ethereum Mainnet (optional)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Polygon (optional)
POLYGON_RPC_URL=https://polygon-rpc.com

# Etherscan API (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gas reporting
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_key
```

### 3. Create Hardhat Project Structure

```bash
mkdir -p contracts test scripts
```

### 4. Deploy the Contract

```bash
# For testnet (Sepolia)
npx hardhat run deploy.js --network sepolia

# For local testing
npx hardhat run deploy.js --network localhost
```

## Integration with Express API

### Option A: Direct Contract Interaction

Modify `verinetworkNode.js` to interact with the smart contract:

```javascript
const Web3 = require('web3');
const contractABI = require('./CocoaChain.json'); // ABI from compilation

const web3 = new Web3(process.env.RPC_URL);
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

// POST /sale endpoint now calls smart contract
app.post('/sale', async (req, res) => {
  const { sellerId, buyerName, quantityKg, price } = req.body;
  
  try {
    const tx = await contract.methods.recordSale(
      sellerId,
      buyerName,
      quantityKg,
      price
    ).send({ from: SELLER_ADDRESS });
    
    res.json({ 
      note: 'Sale recorded on blockchain',
      transactionHash: tx.transactionHash,
      saleId: tx.events.SaleRecorded.returnValues.saleId
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Option B: Hybrid Approach (Recommended)

Keep custom blockchain for local testing, use smart contract for production:

```javascript
let blockchain = process.env.USE_SMART_CONTRACT 
  ? new SmartContractBlockchain(CONTRACT_ADDRESS)
  : new Blockchain(currentNodeUrl);

// Both implement same interface
class BlockchainInterface {
  async recordSale(sellerId, buyerName, quantityKg, price) { }
  async getSale(saleId) { }
  async getStatistics() { }
}
```

## Frontend Integration

### Update Frontend to Support Smart Contract

Modify `frontend/index.html` to detect and use smart contract:

```javascript
// Add Web3 detection
const WEB3_ENABLED = typeof window.ethereum !== 'undefined';

// Replace storage-based blockchain with Web3 calls
async function recordSale() {
  if (WEB3_ENABLED) {
    // Use smart contract
    const saleId = await recordSaleToSmartContract();
  } else {
    // Use existing localStorage-based method
    recordSaleLocally();
  }
}

// Add wallet connection
async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    userAddress = accounts[0];
    console.log('Connected:', userAddress);
  } catch (error) {
    console.error('Failed to connect wallet:', error);
  }
}
```

## Testing

### Unit Tests

Create `test/CocoaChain.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CocoaChain", function () {
  let cocoaChain;
  let owner, seller, buyer, verifier;

  beforeEach(async function () {
    [owner, seller, buyer, verifier] = await ethers.getSigners();
    const CocoaChain = await ethers.getContractFactory("CocoaChain");
    cocoaChain = await CocoaChain.deploy();
  });

  it("Should record a sale", async function () {
    const tx = await cocoaChain.recordSale(
      "SELLER001",
      "Buyer Corp",
      100,
      5000
    );
    
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
    
    const sale = await cocoaChain.getSale(0);
    expect(sale.sellerId).to.equal("SELLER001");
  });

  it("Should verify a sale", async function () {
    await cocoaChain.recordSale("SELLER001", "Buyer", 100, 5000);
    
    await cocoaChain.addVerifier(verifier.address);
    await cocoaChain.connect(verifier).verifySale(0);
    
    const sale = await cocoaChain.getSale(0);
    expect(sale.verified).to.be.true;
  });

  it("Should get statistics", async function () {
    await cocoaChain.recordSale("SELLER001", "Buyer1", 100, 5000);
    await cocoaChain.recordSale("SELLER002", "Buyer2", 50, 6000);
    
    const stats = await cocoaChain.getStatistics();
    expect(stats._totalSales).to.equal(2);
    expect(stats._totalCocoaQuantity).to.equal(150);
  });
});
```

Run tests:
```bash
npx hardhat test
```

## Migration Path

### Phase 1: Parallel System (Current)
- Keep existing JavaScript blockchain
- Deploy smart contract to testnet
- Test integration locally

### Phase 2: Hybrid Mode
- Use smart contract for important records
- Keep local blockchain for speed
- Sync periodically

### Phase 3: Full Smart Contract
- Migrate all data to blockchain
- Use smart contract as single source of truth
- Archive local blockchain

## Security Checklist

- [ ] Contracts audited by security firm
- [ ] Private keys never committed to repo
- [ ] `.env` file in `.gitignore`
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all functions
- [ ] Test coverage > 80%
- [ ] Emergency pause mechanism implemented

## Deployment Checklist

### Before Mainnet Deployment

- [ ] Testnet deployment successful
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Gas optimization verified
- [ ] Contract verified on Etherscan
- [ ] Monitoring/alerting set up
- [ ] Documentation complete
- [ ] Team trained on operations

### Environment-Specific Setup

**Testnet (Sepolia):**
```bash
npm run deploy:sepolia
```

**Mainnet:**
```bash
npm run deploy:mainnet
```

**Local Development:**
```bash
npx hardhat node
npx hardhat run deploy.js --network localhost
```

## Monitoring & Alerts

### RPC Monitoring
```javascript
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

provider.on('block', (blockNumber) => {
  console.log('New block:', blockNumber);
  // Update frontend
  updateUI();
});

provider.on('error', (error) => {
  console.error('RPC error:', error);
  // Alert monitoring system
});
```

## Troubleshooting

### Common Issues

**Issue: Contract deployment fails**
- Check private key format
- Verify sufficient testnet ETH balance
- Confirm RPC URL is correct

**Issue: Transaction reverts**
- Check input validation
- Verify caller has required permissions
- Look at detailed error message

**Issue: Gas fees too high**
- Optimize contract (already done with OpenZeppelin patterns)
- Use Polygon for lower fees
- Batch transactions

## Useful Links

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Sepolia Faucet](https://sepolia-faucet.pk910.de/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)

## Next Steps

1. **Install dependencies** - `npm install`
2. **Set up environment** - Create `.env` file
3. **Deploy contract** - `npx hardhat run deploy.js --network sepolia`
4. **Run tests** - `npx hardhat test`
5. **Integrate with frontend** - Update API calls
6. **Monitor deployment** - Check contract on Etherscan

## Support & Questions

For issues or questions:
1. Check this guide and contract documentation
2. Review Hardhat documentation
3. Check Etherscan for contract details
4. Consult security audit report

---

**Last Updated:** 2024
**Contract Version:** 1.0.0
**Solidity Version:** 0.8.20
