// Define the API base URL and endpoint for fetching top 100 cryptocurrencies
const apiBaseURL = 'https://api.coingecko.com/api/v3';
const top100URL = `${apiBaseURL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1`;
let myList = []; // Array to store user's favorite cryptocurrencies

const coinDictionary = {
    BTC: "bitcoin",
    ETH: "ethereum",
    ADA: "cardano",
    //... add other coins as needed
};

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchTop100Cryptos();
    loadMyListFromLocalStorage();
    loadDefaultSearchedCoin();
    setInterval(fetchTop100Cryptos, 30000); // Update prices every 30 seconds
});

// Fetch the top 100 cryptocurrencies and display them, update "My List" and "Winners" prices
async function fetchTop100Cryptos() {
    try {
        const response = await fetch(top100URL);
        if (!response.ok) throw new Error("Failed to fetch data from API.");
        const data = await response.json();
        displayCryptos(data);
        updateMyListPrices(data);
        displayTopWinners(data);
    } catch (error) {
        console.error('Error fetching top 100 cryptos:', error);
    }
}

// Display the list of top 100 cryptocurrencies with an "Add" button
function displayCryptos(data) {
    const cryptoList = document.getElementById('crypto-list');
    if (!cryptoList) return; // Ensure the element exists

    cryptoList.innerHTML = data.map(coin => `
        <div class="crypto" id="crypto-${coin.id}">
            <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
            <p class="price" id="price-${coin.id}">Price: $${coin.current_price.toLocaleString()}</p>
            <p>Market Cap: $${coin.market_cap.toLocaleString()}</p>
            <button class="add-btn" onclick="addToMyList('${coin.id}', '${coin.name}', '${coin.symbol}', ${coin.current_price})">Add to My List</button>
        </div>
    `).join('');
}

// Display the top gainers (winners) from the last 24 hours
function displayTopWinners(data) {
    const winnersList = document.getElementById('winners-list');
    if (!winnersList) return; // Ensure the element exists

    const topWinners = data
        .filter(coin => coin.price_change_percentage_24h !== null && coin.price_change_percentage_24h !== undefined)
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, 10);

    winnersList.innerHTML = topWinners.map(coin => `
        <div class="crypto" id="winner-${coin.id}">
            <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
            <p class="price" id="winner-price-${coin.id}">Price: $${coin.current_price.toLocaleString()}</p>
            <p>24h Change: ${coin.price_change_percentage_24h > 0 ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%</p>
            <button class="add-btn" onclick="addToMyList('${coin.id}', '${coin.name}', '${coin.symbol}', ${coin.current_price})">Add to My List</button>
        </div>
    `).join('');
}

// Load Bitcoin as the default searched coin
function loadDefaultSearchedCoin() {
    searchCryptoById('bitcoin');
}

// Search for a cryptocurrency by name or symbol
function searchCrypto() {
    const query = document.getElementById('search-bar').value.trim().toUpperCase();
    if (!query) return alert('Please enter a cryptocurrency name or symbol.');

    const coinId = coinDictionary[query] || query.toLowerCase();
    searchCryptoById(coinId);
}

// Fetch and display the searched cryptocurrency
async function searchCryptoById(coinId) {
    const searchURL = `${apiBaseURL}/simple/price?ids=${coinId}&vs_currencies=usd`;
    try {
        const response = await fetch(searchURL);
        if (!response.ok) throw new Error("Failed to fetch data for searched coin.");
        const data = await response.json();
        displaySearchedCoin(data, coinId);
    } catch (error) {
        console.error('Error searching for crypto:', error);
    }
}

// Display searched cryptocurrency
function displaySearchedCoin(data, coinId) {
    const searchedCoinDiv = document.getElementById('searched-coin');
    if (!searchedCoinDiv) return; // Ensure the element exists

    searchedCoinDiv.innerHTML = data[coinId] ? `
        <div class="crypto">
            <h3>${coinId.toUpperCase()}</h3>
            <p class="price">Price: $${data[coinId].usd.toLocaleString()}</p>
            <button class="add-btn" onclick="addToMyList('${coinId}', '${coinId.toUpperCase()}', '${coinId}', ${data[coinId].usd})">Add to My List</button>
        </div>
    ` : `<p>Coin not found.</p>`;
}

// Add a cryptocurrency to "My List" and save it in localStorage
function addToMyList(id, name, symbol, price) {
    if (myList.some(coin => coin.id === id)) {
        alert(`${name} is already in your list.`);
        return;
    }
    myList.push({ id, name, symbol, price });
    saveMyListToLocalStorage();
    displayMyList();
}

// Remove a cryptocurrency from "My List"
function removeFromMyList(id) {
    myList = myList.filter(coin => coin.id !== id);
    saveMyListToLocalStorage();
    displayMyList();
}

// Display "My List" with an option to remove items
function displayMyList() {
    const myListSection = document.getElementById('my-list');
    if (!myListSection) return; // Ensure the element exists

    myListSection.innerHTML = myList.map(coin => `
        <div class="crypto" id="mylist-${coin.id}">
            <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
            <p class="price" id="mylist-price-${coin.id}">Price: $${coin.price.toLocaleString()}</p>
            <button class="remove-btn" onclick="removeFromMyList('${coin.id}')">Remove</button>
        </div>
    `).join('');
}

// Save "My List" to localStorage
function saveMyListToLocalStorage() {
    localStorage.setItem('myList', JSON.stringify(myList));
}

// Load "My List" from localStorage
function loadMyListFromLocalStorage() {
    const savedList = localStorage.getItem('myList');
    if (savedList) {
        myList = JSON.parse(savedList);
        displayMyList();
    }
}

// Update prices in "My List" and synchronize them across all sections
function updateMyListPrices(top100Data) {
    myList.forEach(coin => {
        const match = top100Data.find(c => c.id === coin.id);
        if (match) {
            coin.price = match.current_price;
            document.getElementById(`mylist-price-${coin.id}`).innerText = `Price: $${match.current_price.toLocaleString()}`;
        }
    });
    saveMyListToLocalStorage();

    // Synchronize prices across Top 100 list, Top Winners, and My List
    top100Data.forEach(coin => {
        const price = `Price: $${coin.current_price.toLocaleString()}`;
        if (document.getElementById(`price-${coin.id}`)) {
            document.getElementById(`price-${coin.id}`).innerText = price;
        }
        if (document.getElementById(`winner-price-${coin.id}`)) {
            document.getElementById(`winner-price-${coin.id}`).innerText = price;
        }
        if (document.getElementById(`mylist-price-${coin.id}`)) {
            document.getElementById(`mylist-price-${coin.id}`).innerText = price;
        }
    });
}

        // Initialize EmailJS
        emailjs.init("dZjFKcVTnuzfAOI3K"); // Replace with your actual public key

        function sendEmail() {
            const email = document.getElementById('emailInput').value;

            if (!email) {
                alert("Please enter a valid email address.");
                return;
            }

            const serviceID = "service_mj2m5yp"; // Replace with your actual service ID
            const templateID = "template_j3iwbkn"; // Replace with your actual template ID

            const templateParams = { to_email: email };

            emailjs.send(serviceID, templateID, templateParams)
                .then(response => {
                    alert("Email updates will be available soon!");
                    console.log("SUCCESS:", response);
                })
                .catch(error => {
                    alert("Failed to send email. Please try again.");
                    console.error("ERROR:", error);
                });
        }