// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CocoaChain {
    struct Sale {
        uint256 saleId;
        string sellerId;
        string buyerName;
        uint256 quantityKg;
        uint256 price;
        uint256 timestamp;
    }

    struct Seller {
        string sellerId;
        address walletAddress;
        uint256 totalSales;
        uint256 totalQuantity;
        uint256 totalRevenue;
        bool exists;
    }

    Sale[] public sales;
    Seller[] public sellers;

    // sellerId => Seller data
    mapping(string => Seller) private sellerMapping;
    
    // wallet address => sellerId
    mapping(address => string) private addressToSellerId;

    // sellerId => hasSold
    mapping(string => bool) private sellerHasSold;

    // sellerId => total cocoa sold
    mapping(string => uint256) private cocoaPerSeller;

    uint256 public totalCocoaSold;
    uint256 private saleCounter = 0;

    event SaleRecorded(
        uint256 indexed saleId,
        string sellerId,
        string buyerName,
        uint256 quantityKg,
        uint256 price,
        uint256 timestamp
    );

    event SellerRegistered(
        string sellerId,
        address walletAddress,
        uint256 timestamp
    );

    // Generate unique seller ID
    function generateSellerId(address walletAddress) internal view returns (string memory) {
        bytes memory addr = abi.encodePacked(walletAddress);
        bytes16 hexChars = "0123456789abcdef";
        bytes memory result = new bytes(10);
        result[0] = 'S';
        result[1] = 'E';
        result[2] = 'L';
        for (uint256 i = 0; i < 7; i++) {
            uint8 value = uint8(addr[i]);
            result[3 + i] = hexChars[value % 16];
        }
        return string(result);
    }

    // Register seller and get/generate seller ID
    function registerSeller() public returns (string memory) {
        string memory sellerId = generateSellerId(msg.sender);
        
        if (!sellerMapping[sellerId].exists) {
            Seller memory newSeller = Seller({
                sellerId: sellerId,
                walletAddress: msg.sender,
                totalSales: 0,
                totalQuantity: 0,
                totalRevenue: 0,
                exists: true
            });
            
            sellerMapping[sellerId] = newSeller;
            addressToSellerId[msg.sender] = sellerId;
            sellers.push(newSeller);
            
            emit SellerRegistered(sellerId, msg.sender, block.timestamp);
        }
        
        return sellerId;
    }

    // Get seller ID for current address
    function getSellerIdForAddress(address walletAddress) public view returns (string memory) {
        string memory sellerId = generateSellerId(walletAddress);
        require(sellerMapping[sellerId].exists, "Seller not registered");
        return sellerId;
    }

    // Check if seller is registered
    function isSellerRegistered(string memory sellerId) public view returns (bool) {
        return sellerMapping[sellerId].exists;
    }

    // Record a cocoa sale - SINGLE SALE ONLY (use recordSaleMultiple for multiple)
    function recordSale(
        string memory sellerId,
        string memory buyerName,
        uint256 quantityKg,
        uint256 price
    ) public returns (uint256) {
        require(sellerMapping[sellerId].exists, "Seller not registered");
        require(!sellerHasSold[sellerId], "Seller already recorded a sale in this transaction batch");
        require(quantityKg > 0, "Quantity must be greater than zero");
        require(price > 0, "Price must be greater than zero");

        saleCounter++;
        uint256 currentSaleId = saleCounter;

        Sale memory newSale = Sale({
            saleId: currentSaleId,
            sellerId: sellerId,
            buyerName: buyerName,
            quantityKg: quantityKg,
            price: price,
            timestamp: block.timestamp
        });

        sales.push(newSale);
        sellerHasSold[sellerId] = true;
        cocoaPerSeller[sellerId] += quantityKg;
        
        // Update seller stats
        sellerMapping[sellerId].totalSales++;
        sellerMapping[sellerId].totalQuantity += quantityKg;
        sellerMapping[sellerId].totalRevenue += (price * quantityKg);
        
        totalCocoaSold += quantityKg;

        emit SaleRecorded(
            currentSaleId,
            sellerId,
            buyerName,
            quantityKg,
            price,
            block.timestamp
        );
        
        return currentSaleId;
    }

    // Allow unlimited sales per seller - RECOMMENDED FOR PRODUCTION
    function recordSaleMultiple(
        string memory sellerId,
        string memory buyerName,
        uint256 quantityKg,
        uint256 price
    ) public returns (uint256) {
        require(sellerMapping[sellerId].exists, "Seller not registered");
        require(quantityKg > 0, "Quantity must be greater than zero");
        require(price > 0, "Price must be greater than zero");

        saleCounter++;
        uint256 currentSaleId = saleCounter;

        Sale memory newSale = Sale({
            saleId: currentSaleId,
            sellerId: sellerId,
            buyerName: buyerName,
            quantityKg: quantityKg,
            price: price,
            timestamp: block.timestamp
        });

        sales.push(newSale);
        cocoaPerSeller[sellerId] += quantityKg;
        
        // Update seller stats
        sellerMapping[sellerId].totalSales++;
        sellerMapping[sellerId].totalQuantity += quantityKg;
        sellerMapping[sellerId].totalRevenue += (price * quantityKg);
        
        totalCocoaSold += quantityKg;

        emit SaleRecorded(
            currentSaleId,
            sellerId,
            buyerName,
            quantityKg,
            price,
            block.timestamp
        );
        
        return currentSaleId;
    }

    // Get total number of sales
    function getSalesCount() public view returns (uint256) {
        return sales.length;
    }

    // Get sale by index
    function getSale(uint256 index) public view returns (Sale memory) {
        require(index < sales.length, "Invalid index");
        return sales[index];
    }

    // Get cocoa sold by seller
    function getSellerTotal(string memory sellerId) public view returns (uint256) {
        return cocoaPerSeller[sellerId];
    }

    // Get all sellers count
    function getSellersCount() public view returns (uint256) {
        return sellers.length;
    }

    // Get seller by index
    function getSellerByIndex(uint256 index) public view returns (Seller memory) {
        require(index < sellers.length, "Invalid index");
        return sellers[index];
    }

    // Get seller details by ID
    function getSellerDetails(string memory sellerId) public view returns (Seller memory) {
        require(sellerMapping[sellerId].exists, "Seller not found");
        return sellerMapping[sellerId];
    }

    // Get all sales for a specific seller
    function getSellerSales(string memory sellerId) public view returns (Sale[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < sales.length; i++) {
            if (keccak256(abi.encodePacked(sales[i].sellerId)) == keccak256(abi.encodePacked(sellerId))) {
                count++;
            }
        }

        Sale[] memory sellerSales = new Sale[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < sales.length; i++) {
            if (keccak256(abi.encodePacked(sales[i].sellerId)) == keccak256(abi.encodePacked(sellerId))) {
                sellerSales[index] = sales[i];
                index++;
            }
        }
        return sellerSales;
    }
}
