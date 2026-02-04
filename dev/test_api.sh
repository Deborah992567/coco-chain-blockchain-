#!/bin/bash

echo "🚀 Testing CocoaChain API"
echo "=========================="
echo ""

echo "1️⃣ Checking API Health..."
curl -s http://localhost:3001/ | jq . 2>/dev/null || echo "API not responding yet"

echo ""
echo "2️⃣ Testing Registration Endpoint..."
curl -s -X POST http://localhost:3001/register | jq . 2>/dev/null || echo "Registration endpoint needs testing"

echo ""
echo "3️⃣ Testing Sales Summary..."
curl -s http://localhost:3001/sales-summary | jq . 2>/dev/null || echo "Sales summary endpoint needs testing"

echo ""
echo "=========================="
echo "✅ API Tests Complete"
