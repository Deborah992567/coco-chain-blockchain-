const NODE = 'http://localhost:3001'; // change to node_2/node_3 if needed

function recordSale() {
  const sellerId = document.getElementById('sellerId').value;
  const buyerName = document.getElementById('buyerName').value;
  const quantityKg = parseFloat(document.getElementById('quantityKg').value);
  const price = parseFloat(document.getElementById('price').value);

  if (!sellerId || !buyerName || !quantityKg || !price) return alert("All fields required");

  fetch(`${NODE}/sale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sellerId, buyerName, quantityKg, price })
  })
  .then(res => res.json())
  .then(data => document.getElementById('output').textContent = data.error ? `❌ ${data.error}` : `✅ ${data.note}`)
  .catch(err => document.getElementById('output').textContent = `Error: ${err}`);
}

function mineSales() {
  fetch(`${NODE}/mine`).then(res => res.json())
  .then(data => document.getElementById('output').textContent = JSON.stringify(data, null, 2))
  .catch(err => document.getElementById('output').textContent = `Error: ${err}`);
}

function getSalesSummary() {
  fetch(`${NODE}/sales-summary`).then(res => res.json())
  .then(data => document.getElementById('output').textContent = JSON.stringify(data, null, 2))
  .catch(err => document.getElementById('output').textContent = `Error: ${err}`);
}

function getBlockchain() {
  fetch(`${NODE}/blockchain`).then(res => res.json())
  .then(data => document.getElementById('output').textContent = JSON.stringify(data, null, 2))
  .catch(err => document.getElementById('output').textContent = `Error: ${err}`);
}
