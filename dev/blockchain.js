const sha256 = require('sha256');

function Blockchain(currentNodeUrl) {
  this.chain = [];
  this.pendingSales = [];
  this.currentNodeUrl = currentNodeUrl || 'http://localhost:3001';
  this.networkNodes = [];

  // Genesis block
  this.createNewBlock(100, '0', '0');
}

// Create new block
Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
  const newBlock = {
    index: this.chain.length,
    timestamp: Date.now(),
    sales: this.pendingSales,
    nonce,
    hash,
    previousBlockHash
  };
  this.pendingSales = [];
  this.chain.push(newBlock);
  return newBlock;
};

// Get last block
Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
};

// Create sale transaction - allows multiple sales per seller
Blockchain.prototype.createSale = function(sellerId, buyerName, quantityKg, price) {
  // Validate inputs
  if (!sellerId || !buyerName || quantityKg <= 0 || price <= 0) {
    return null;
  }
  
  return {
    sellerId,
    buyerName,
    quantityKg,
    price,
    timestamp: Date.now()
  };
};

// Add sale to pending
Blockchain.prototype.addSaleToPending = function(sale) {
  if (!sale) return null;
  this.pendingSales.push(sale);
  return this.getLastBlock().index + 1;
};

// Mining: hash a block
Blockchain.prototype.hashBlock = function(prevHash, blockData, nonce) {
  return sha256(prevHash + nonce.toString() + JSON.stringify(blockData));
};

// Proof of Work
Blockchain.prototype.proofOfWork = function(prevHash, blockData) {
  let nonce = 0;
  let hash = this.hashBlock(prevHash, blockData, nonce);
  while (hash.substring(0, 2) !== '00') {
    nonce++;
    hash = this.hashBlock(prevHash, blockData, nonce);
  }
  return nonce;
};

// Sales summary: total per seller & total cocoa sold
Blockchain.prototype.salesSummary = function() {
  const summary = {};
  let totalCocoa = 0;
  let totalRevenue = 0;

  this.chain.forEach(block => {
    block.sales.forEach(sale => {
      if (!summary[sale.sellerId]) {
        summary[sale.sellerId] = {
          sales: 0,
          quantity: 0,
          revenue: 0
        };
      }
      summary[sale.sellerId].sales++;
      summary[sale.sellerId].quantity += sale.quantityKg;
      summary[sale.sellerId].revenue += (sale.price * sale.quantityKg);
      totalCocoa += sale.quantityKg;
      totalRevenue += (sale.price * sale.quantityKg);
    });
  });

  return {
    summaryPerSeller: summary,
    totalCocoa,
    totalRevenue,
    averagePricePerKg: totalCocoa > 0 ? (totalRevenue / totalCocoa).toFixed(2) : 0
  };
};

// Get all sales across chain
Blockchain.prototype.getAllSales = function() {
  const allSales = [];
  this.chain.forEach(block => {
    allSales.push(...block.sales);
  });
  return allSales;
};

// Get sales by seller
Blockchain.prototype.getSellerSales = function(sellerId) {
  const sellerSales = [];
  this.chain.forEach(block => {
    block.sales.forEach(sale => {
      if (sale.sellerId === sellerId) {
        sellerSales.push(sale);
      }
    });
  });
  return sellerSales;
};

module.exports = Blockchain;
