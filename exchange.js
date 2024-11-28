let userBalanceUSDT = parseFloat(localStorage.getItem("usdtBalance")) || 100000; // Persist balance
let portfolio = JSON.parse(localStorage.getItem("portfolio")) || {}; // Persist portfolio

// DOM Elements
const usdtBalanceEl = document.getElementById("usdt-balance");
const portfolioWorthEl = document.getElementById("portfolio-worth");
const cryptoSearchEl = document.getElementById("crypto-search");
const searchResultsEl = document.getElementById("crypto-results");
const portfolioEl = document.getElementById("portfolio");
const sellCryptoEl = document.getElementById("sell-crypto");
const sellAmountEl = document.getElementById("sell-amount");
const sellButtonEl = document.getElementById("sell-button");

// Current selected crypto for buy section
let selectedCryptoForBuy = null; // {id, symbol, price, image}

// Utility functions to handle localStorage
function saveDataToLocalStorage() {
  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  localStorage.setItem("usdtBalance", userBalanceUSDT.toFixed(2));
}

// Function to update the balance and portfolio worth on the UI
function updateUI() {
  // Update USDT balance
  usdtBalanceEl.textContent = `${userBalanceUSDT.toFixed(2)} USDT`;

  // Calculate total crypto worth
  let cryptoWorth = 0;
  portfolioEl.innerHTML = ""; // Clear portfolio

  Object.entries(portfolio).forEach(([id, crypto]) => {
    cryptoWorth += crypto.amount * crypto.currentPrice;

    // Create portfolio card
    const cryptoCard = document.createElement("div");
    cryptoCard.className = "crypto-card";
    cryptoCard.innerHTML = `
      <img src="${crypto.image}" alt="${crypto.symbol}" class="crypto-logo" />
      <strong>${crypto.symbol.toUpperCase()}</strong><br>
      Amount Owned: ${crypto.amount.toFixed(6)}<br>
      Current Value: ${(crypto.amount * crypto.currentPrice).toFixed(2)} USDT<br>
      Current Price: ${crypto.currentPrice.toFixed(2)} USDT
    `;
    portfolioEl.appendChild(cryptoCard);
  });

  // Update portfolio worth
  const portfolioWorth = userBalanceUSDT + cryptoWorth;
  portfolioWorthEl.textContent = `${portfolioWorth.toFixed(2)} USDT`;

  // Populate sell dropdown
  sellCryptoEl.innerHTML = `<option value="">-- Your Owned Crypto --</option>`;
  Object.entries(portfolio).forEach(([id, crypto]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${crypto.symbol.toUpperCase()} (${crypto.amount.toFixed(6)})`;
    sellCryptoEl.appendChild(option);
  });

  saveDataToLocalStorage();
}

// Fetch cryptos based on user search query
async function fetchCryptoSearch(query) {
  if (!query) {
    searchResultsEl.innerHTML = ""; // Clear search results
    return;
  }

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
    const data = await response.json();
    displaySearchResults(data.coins);
  } catch (error) {
    console.error("Error fetching crypto search results:", error);
  }
}

// Display search results
function displaySearchResults(cryptos) {
  searchResultsEl.innerHTML = ""; // Clear existing results

  cryptos.forEach((crypto) => {
    const cryptoCard = document.createElement("div");
    cryptoCard.className = "crypto-card";
    cryptoCard.innerHTML = `
      <img src="${crypto.thumb}" alt="${crypto.symbol}" class="crypto-logo" />
      <strong>${crypto.name} (${crypto.symbol.toUpperCase()})</strong>
      <button onclick="fetchCryptoDetails('${crypto.id}', '${crypto.symbol}', '${crypto.thumb}')">Buy</button>
    `;
    searchResultsEl.appendChild(cryptoCard);
  });
}

// Fetch live price details for the selected crypto
async function fetchCryptoDetails(id, symbol, image) {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
    const data = await response.json();
    const price = data[id].usd;
    selectedCryptoForBuy = { id, symbol, price, image };
    displayCryptoPurchase(symbol, price, image);
  } catch (error) {
    console.error("Error fetching crypto price details:", error);
  }
}

// Display crypto purchase options
function displayCryptoPurchase(symbol, price, image) {
  searchResultsEl.innerHTML = `
    <div class="crypto-card">
      <img src="${image}" alt="${symbol}" class="crypto-logo" />
      <strong>${symbol.toUpperCase()}</strong><br>
      Current Price: <span id="buy-price">${price.toFixed(2)}</span> USDT<br>
      <input type="number" id="buy-amount" placeholder="Enter amount in USDT" style="margin-top: 10px;" />
      <button onclick="buyCrypto()">Confirm Purchase</button>
    </div>
  `;
}

// Buy crypto
function buyCrypto() {
  if (!selectedCryptoForBuy) return alert("No crypto selected for purchase.");

  const buyAmountEl = document.getElementById("buy-amount");
  const buyAmountUSDT = parseFloat(buyAmountEl.value);

  if (isNaN(buyAmountUSDT) || buyAmountUSDT <= 0) {
    alert("Please enter a valid amount in USDT.");
    return;
  }

  if (buyAmountUSDT > userBalanceUSDT) {
    alert("Insufficient USDT balance.");
    return;
  }

  const { id, symbol, price, image } = selectedCryptoForBuy;
  const amountPurchased = buyAmountUSDT / price;

  // Update balance and portfolio
  userBalanceUSDT -= buyAmountUSDT;

  if (!portfolio[id]) {
    portfolio[id] = { symbol, amount: 0, currentPrice: price, image };
  }
  portfolio[id].amount += amountPurchased;
  portfolio[id].currentPrice = price;

  alert(`You successfully bought ${amountPurchased.toFixed(6)} ${symbol.toUpperCase()} for ${buyAmountUSDT.toFixed(2)} USDT.`);
  updateUI();
}

// Sell crypto
function sellCrypto() {
  const selectedCryptoId = sellCryptoEl.value;
  const sellAmount = parseFloat(sellAmountEl.value);

  if (!selectedCryptoId || isNaN(sellAmount) || sellAmount <= 0) {
    alert("Please select a crypto and enter a valid amount.");
    return;
  }

  const crypto = portfolio[selectedCryptoId];
  if (!crypto || sellAmount > crypto.amount) {
    alert("Insufficient crypto amount to sell.");
    return;
  }

  const sellValueUSDT = sellAmount * crypto.currentPrice;

  crypto.amount -= sellAmount;
  userBalanceUSDT += sellValueUSDT;

  if (crypto.amount <= 0) {
    delete portfolio[selectedCryptoId];
  }

  alert(`You successfully sold ${sellAmount.toFixed(6)} ${crypto.symbol.toUpperCase()} for ${sellValueUSDT.toFixed(2)} USDT.`);
  updateUI();
}

// Update prices for portfolio and buy section periodically
async function updatePortfolioPrices() {
  const ids = Object.keys(portfolio).join(",");
  if (!ids) return;

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const data = await response.json();

    Object.entries(portfolio).forEach(([id, crypto]) => {
      if (data[id]) {
        crypto.currentPrice = data[id].usd;
      }
    });

    if (selectedCryptoForBuy && data[selectedCryptoForBuy.id]) {
      selectedCryptoForBuy.price = data[selectedCryptoForBuy.id].usd;
      const buyPriceEl = document.getElementById("buy-price");
      if (buyPriceEl) buyPriceEl.textContent = selectedCryptoForBuy.price.toFixed(2);
    }

    updateUI();
  } catch (error) {
    console.error("Error updating portfolio prices:", error);
  }
}

// Initialize app
function initializeApp() {
  updateUI();
  cryptoSearchEl.addEventListener("input", (e) => fetchCryptoSearch(e.target.value));
  sellButtonEl.addEventListener("click", sellCrypto);
  setInterval(updatePortfolioPrices, 10000); // Update every 10 seconds
}

initializeApp();


// trending 

const trendingCoinsEl = document.getElementById("trending-coins");

// Fetch trending coins and display them
async function fetchTrendingCoins() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/search/trending");
    const data = await response.json();

    displayTrendingCoins(data.coins);
  } catch (error) {
    console.error("Error fetching trending coins:", error);
    trendingCoinsEl.innerHTML = "<p>Unable to load trending coins. Please try again later.</p>";
  }
}

// Display trending coins
function displayTrendingCoins(coins) {
  trendingCoinsEl.innerHTML = ""; // Clear existing content

  coins.slice(0, 50).forEach((coin) => {
    const coinCard = document.createElement("div");
    coinCard.className = "trending-card";
    coinCard.innerHTML = `
      <img src="${coin.item.small}" alt="${coin.item.symbol}" />
      <strong>${coin.item.name}</strong>
      <span>${coin.item.symbol.toUpperCase()}</span>
      <span>Rank: ${coin.item.market_cap_rank || "N/A"}</span>
    `;
    trendingCoinsEl.appendChild(coinCard);
  });
}

// Initialize trending section
fetchTrendingCoins();
