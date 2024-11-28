// Fetch Data from CoinGecko API and Display Top Cryptos and 24-Hour Winners
document.addEventListener("DOMContentLoaded", () => {
    const topCryptosList = document.querySelector('.top-cryptos01');
    const topWinnersList = document.querySelector('.top-winners01');
  
    // Fetch Top Cryptocurrencies
    async function fetchTopCryptos() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1');
        const data = await response.json();
        displayCryptos(data, topCryptosList);
      } catch (error) {
        console.error('Error fetching top cryptocurrencies:', error);
      }
    }
  
    // Fetch Top 24-Hour Winners
    async function fetchTopWinners() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1');
        const data = await response.json();
        const topWinners = data
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
          .slice(0, 5);
        displayCryptos(topWinners, topWinnersList);
      } catch (error) {
        console.error('Error fetching 24-hour winners:', error);
      }
    }

    // Display Cryptocurrencies with Winning Percentage and Up Arrow
function displayCryptos(cryptos, targetList) {
  cryptos.forEach(crypto => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <img src="${crypto.image}" alt="${crypto.name}">
      <span>${crypto.name} - $${crypto.current_price.toLocaleString()}</span>
      ${
        targetList.classList.contains('top-winners01') 
        ? `<span class="winning-percentage01">▲ ${crypto.price_change_percentage_24h.toFixed(2)}%</span>` 
        : ''
      }
    `;
    targetList.appendChild(listItem);
  });
}

  
    // Initial Fetch
    fetchTopCryptos();
    fetchTopWinners();
  });

  const fetchTop50Cryptos = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'
      );
      const data = await response.json();
  
      const tableBody = document.getElementById('crypto-table-body03');
      tableBody.innerHTML = ''; // Clear previous rows if any
  
      data.forEach((crypto, index) => {
        const row = document.createElement('tr');
  
        row.innerHTML = `
          <td>${index + 1}</td>
          <td class="crypto-logo-name03">
            <img src="${crypto.image}" alt="${crypto.name}">
            ${crypto.name}
          </td>
          <td>$${crypto.current_price.toLocaleString()}</td>
          <td class="${crypto.price_change_percentage_24h >= 0 ? 'positive-change03' : 'negative-change03'}">
            ${crypto.price_change_percentage_24h.toFixed(2)}%
          </td>
        `;
  
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error('Error fetching top 50 cryptocurrencies:', error);
    }
  };
  
  // Fetch and display top 50 cryptos on page load
  fetchTop50Cryptos();
  
  