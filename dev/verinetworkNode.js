const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const ethers = require("ethers");
const { v4: uuidv4 } = require("uuid");

const CocoaChainAbi = require("../artifacts/contracts/CocoaChain.sol/CocoaChain.json");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
let signer;
let contractRead;
let contractWrite;
let CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Initialize contract
async function initializeContract() {
  try {
    signer = await provider.getSigner(0);
    contractRead = new ethers.Contract(CONTRACT_ADDRESS, CocoaChainAbi.abi, provider);
    contractWrite = new ethers.Contract(CONTRACT_ADDRESS, CocoaChainAbi.abi, signer);
    console.log("✓ Contract initialized at:", CONTRACT_ADDRESS);
  } catch (error) {
    console.error("⚠ Contract initialization failed:", error.message);
    console.log("Please ensure the contract is deployed and the address is correct");
  }
}

initializeContract();

// 👇 read-only contract (for GET)
// const contractRead = new ethers.Contract(CONTRACT_ADDRESS, CocoaChainAbi.abi, provider);

// 👇 write contract (for POST)
// const contractWrite = new ethers.Contract(CONTRACT_ADDRESS, CocoaChainAbi.abi, signer);

app.get("/", (req, res) => {
  res.json({
    message: "CocoaChain API v1.0 is running",
    endpoints: {
      "GET /": "API info",
      "POST /register": "Register as seller (returns sellerId)",
      "POST /sale": "Record a sale",
      "GET /sales": "Get all sales",
      "GET /seller/:sellerId": "Get seller details",
      "GET /sales-summary": "Get sales statistics",
      "GET /blockchain": "Get blockchain info"
    }
  });
});

// Helper function to generate seller ID matching smart contract logic
function generateSellerId(walletAddress) {
  // Remove '0x' prefix
  const addr = walletAddress.slice(2);
  
  // Convert address hex string to bytes
  let result = 'SEL';
  const hexChars = '0123456789abcdef';
  
  // Process first 7 bytes of address
  for (let i = 0; i < 7; i++) {
    const byteStr = addr.slice(i * 2, i * 2 + 2);
    const byteVal = parseInt(byteStr, 16);
    result += hexChars[byteVal % 16];
  }
  
  return result;
}

// Register seller and get auto-generated seller ID
app.post("/register", async (req, res) => {
  try {
    if (!contractWrite) {
      return res.status(500).json({ error: "Contract not initialized. Deploy the contract first." });
    }
    
    const tx = await contractWrite.registerSeller();
    const receipt = await tx.wait();
    
    // Generate seller ID based on signer address (matching smart contract logic)
    const signerAddress = await signer.getAddress();
    const sellerId = generateSellerId(signerAddress);
    
    res.json({
      success: true,
      sellerId: sellerId,
      walletAddress: signerAddress,
      transactionHash: receipt.hash,
      message: "Seller registered successfully"
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Record a sale - allows multiple sales per seller
app.post("/sale", async (req, res) => {
  try {
    if (!contractWrite) {
      return res.status(500).json({ error: "Contract not initialized" });
    }
    
    const { sellerId, buyerName, quantityKg, price } = req.body;
    
    // Validate inputs
    if (!sellerId || !buyerName || !quantityKg || !price) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["sellerId", "buyerName", "quantityKg", "price"]
      });
    }
    
    if (isNaN(quantityKg) || quantityKg <= 0) {
      return res.status(400).json({ error: "quantityKg must be a positive number" });
    }
    
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: "price must be a positive number" });
    }
    
    // Check if seller is registered
    const isRegistered = await contractRead.isSellerRegistered(sellerId);
    if (!isRegistered) {
      return res.status(400).json({ error: `Seller ${sellerId} is not registered. Please register first.` });
    }
    
    // Record sale (using recordSaleMultiple to allow multiple sales per seller)
    const tx = await contractWrite.recordSaleMultiple(
      sellerId,
      buyerName,
      ethers.toBigInt(quantityKg),
      ethers.toBigInt(price)
    );
    
    const receipt = await tx.wait();
    
    res.json({
      success: true,
      transactionHash: receipt.hash,
      message: "Sale recorded successfully",
      data: { sellerId, buyerName, quantityKg, price }
    });
  } catch (err) {
    console.error("Sale error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/sale", (req, res) => {
  res.json({
    message: "Use POST /sale to record a sale",
    body: {
      sellerId: "SELLER_ABC123",
      buyerName: "John Doe",
      quantityKg: 100,
      price: 50
    }
  });
});

// Get all sales
app.get("/sales", async (req, res) => {
  try {
    if (!contractRead) {
      return res.status(500).json({ error: "Contract not initialized" });
    }
    
    const count = await contractRead.getSalesCount();
    const sales = [];

    for (let i = 0; i < count; i++) {
      const sale = await contractRead.getSale(i);
      sales.push({
        saleId: sale.saleId.toString(),
        sellerId: sale.sellerId,
        buyerName: sale.buyerName,
        quantityKg: sale.quantityKg.toString(),
        price: sale.price.toString(),
        timestamp: new Date(Number(sale.timestamp) * 1000).toISOString()
      });
    }

    res.json({
      success: true,
      totalSales: sales.length,
      sales: sales
    });
  } catch (err) {
    console.error("Sales error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get specific seller details
app.get("/seller/:sellerId", async (req, res) => {
  try {
    if (!contractRead) {
      return res.status(500).json({ error: "Contract not initialized" });
    }
    
    const { sellerId } = req.params;
    const seller = await contractRead.getSellerDetails(sellerId);
    const sellerSales = await contractRead.getSellerSales(sellerId);
    
    res.json({
      success: true,
      seller: {
        sellerId: seller.sellerId,
        walletAddress: seller.walletAddress,
        totalSales: seller.totalSales.toString(),
        totalQuantity: seller.totalQuantity.toString(),
        totalRevenue: seller.totalRevenue.toString()
      },
      salesCount: sellerSales.length,
      recentSales: sellerSales.slice(-5).map(s => ({
        saleId: s.saleId.toString(),
        buyerName: s.buyerName,
        quantityKg: s.quantityKg.toString(),
        price: s.price.toString(),
        timestamp: new Date(Number(s.timestamp) * 1000).toISOString()
      }))
    });
  } catch (err) {
    console.error("Seller error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/blockchain", async (req, res) => {
  try {
    if (!contractRead) {
      return res.status(500).json({ error: "Contract not initialized" });
    }
    
    const salesCount = await contractRead.getSalesCount();
    const sellersCount = await contractRead.getSellersCount();
    const totalCocoaSold = await contractRead.totalCocoaSold();

    res.json({
      success: true,
      blockchain: {
        totalSales: salesCount.toString(),
        totalSellers: sellersCount.toString(),
        totalCocoaSold: totalCocoaSold.toString(),
        contractAddress: CONTRACT_ADDRESS
      }
    });
  } catch (err) {
    console.error("Blockchain error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/mine", async (req, res) => {
  res.json({
    message: "Mining is automatic on-chain with smart contract.",
    note: "Ethereum uses Proof of Stake, not Proof of Work for block validation"
  });
});

// Sales summary
app.get("/sales-summary", async (req, res) => {
  try {
    if (!contractRead) {
      return res.status(500).json({ error: "Contract not initialized" });
    }
    
    const salesCount = await contractRead.getSalesCount();
    const sellersCount = await contractRead.getSellersCount();
    let totalCocoa = 0;
    let totalRevenue = 0;
    const sellerStats = {};

    for (let i = 0; i < salesCount; i++) {
      const sale = await contractRead.getSale(i);
      const quantity = Number(sale.quantityKg);
      const revenue = Number(sale.price) * quantity;
      
      totalCocoa += quantity;
      totalRevenue += revenue;
      
      if (!sellerStats[sale.sellerId]) {
        sellerStats[sale.sellerId] = { sales: 0, quantity: 0, revenue: 0 };
      }
      sellerStats[sale.sellerId].sales++;
      sellerStats[sale.sellerId].quantity += quantity;
      sellerStats[sale.sellerId].revenue += revenue;
    }

    res.json({
      success: true,
      summary: {
        totalSales: Number(salesCount),
        totalSellers: Number(sellersCount),
        totalCocoaSold: totalCocoa,
        totalRevenue: totalRevenue,
        averagePricePerKg: totalCocoa > 0 ? (totalRevenue / totalCocoa).toFixed(2) : 0
      },
      topSellers: Object.entries(sellerStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([sellerId, stats]) => ({
          sellerId,
          ...stats
        }))
    });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
