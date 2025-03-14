import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());
const port = 3000;

interface CryptoRates {
  bitcoin: number;
  ethereum: number;
  source: string;
}

// Get BTC rates endpoint
app.get('/btc', async (req, res) => {
  try {
    const [coinGeckoRates, coinbaseRates, binanceRates] = await Promise.all([
      getCoinGeckoRates(),
      getCoinbaseRates(),
      getBinanceRates()
    ]);

    const formattedRates = [
      {
        dex: "CoinGecko",
        price: coinGeckoRates.bitcoin * 100,
        timestamp: Math.floor(Date.now() / 1000)
      },
      {
        dex: "Coinbase",
        price: coinbaseRates.bitcoin * 100,
        timestamp: Math.floor(Date.now() / 1000)
      },
      {
        dex: "Binance",
        price: binanceRates.bitcoin * 100,
        timestamp: Math.floor(Date.now() / 1000)
      }
    ];

    res.json(formattedRates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch BTC rates' });
  }
});

// Get ETH rates endpoint
app.get('/eth', async (req, res) => {
  try {
    const [coinGeckoRates, coinbaseRates, binanceRates] = await Promise.all([
      getCoinGeckoRates(),
      getCoinbaseRates(),
      getBinanceRates()
    ]);

    const formattedRates = [
      {
        dex: "CoinGecko",
        price: coinGeckoRates.ethereum * 100,
        timestamp: Math.floor(Date.now() / 1000)
      },
      {
        dex: "Coinbase",
        price: coinbaseRates.ethereum * 100,
        timestamp: Math.floor(Date.now() / 1000)
      },
      {
        dex: "Binance",
        price: binanceRates.ethereum * 100,
        timestamp: Math.floor(Date.now() / 1000)
      }
    ];

    res.json(formattedRates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ETH rates' });
  }
});



// Keep existing exchange fetching functions
async function getCoinGeckoRates(): Promise<CryptoRates> {

  try {
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');

  // console.log("coin Gecko prices are:", response.data['bitcoin'].usd, response.data['ethereum'].usd);
  return {
    bitcoin: response.data['bitcoin'].usd,
    ethereum: response.data['ethereum'].usd,
    source: 'CoinGecko'
  };
} catch (error : any) {
  console.error('Error fetching CoinGecko rates:', error.message);
  throw error;
}
}


async function getCoinbaseRates(): Promise<CryptoRates> {
  
  try {
  const btcResponse = await axios.get('https://api.coinbase.com/v2/prices/BTC-USD/spot');
  const ethResponse = await axios.get('https://api.coinbase.com/v2/prices/ETH-USD/spot');
  
  // console.log("coin base prices are:", btcResponse.data.data.amount, ethResponse.data.data.amount);
  return {
    bitcoin: parseFloat(btcResponse.data.data.amount),
    ethereum: parseFloat(ethResponse.data.data.amount),
    source: 'Coinbase'
  };
} catch (error : any) {
  console.error('Error fetching Coinbase rates:', error.message);
  throw error;
}
}

async function getBinanceRates(): Promise<CryptoRates> {
  try {
  const btcResponse = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
  const ethResponse = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
  
  // console.log("binance prices are:", btcResponse.data.price, ethResponse.data.price);
  return {
    bitcoin: parseFloat(btcResponse.data.price),
    ethereum: parseFloat(ethResponse.data.price),
    source: 'Binance'
  };
} catch (error : any) {
  console.error('Error fetching Binance rates:', error.message);
  throw error;
}
}

app.listen(port, () => {
  console.log(`Kernel server running at http://localhost:${port}`);
});