import express from 'express';
import axios from 'axios';
import { get } from 'http';

const app = express();
app.use(express.json());
const port = 3000;

interface CryptoRates {
  bitcoin: number;
  ethereum: number;
  source: string;
}

interface CacheData {
  rates: CryptoRates;
  timestamp: number;
}

const cache = {
  coinGecko: null as CacheData | null,
  coinbase: null as CacheData | null,
  kucoin: null as CacheData | null
};

const cacheDuration = 300000;

async function getCachedRates(
  exchange: 'coinGecko' | 'coinbase' | 'kucoin',
  fetchFunction: () => Promise<CryptoRates>
): Promise<CryptoRates> {
  const now = Date.now();
  const cacheEntry = cache[exchange];

  if (cacheEntry && now - cacheEntry.timestamp < cacheDuration) {
    return cacheEntry.rates;
  }

  const freshRates = await fetchFunction();
  cache[exchange] = {
    rates: freshRates,
    timestamp: now
  };

  return freshRates;
}

// Get BTC rates endpoint
app.get('/btc', async (req, res) => {
  try {
    const [coinGeckoRates, coinbaseRates, kucoinRates] = await Promise.all([
      getCachedRates('coinGecko', getCoinGeckoRates),
      getCachedRates('coinbase', getCoinbaseRates),
      getCachedRates('kucoin', getKucoinRates)
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
        dex: "KuCoin",
        price: kucoinRates.bitcoin * 100,
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
    const [coinGeckoRates, coinbaseRates, kucoinRates] = await Promise.all([
      getCachedRates('coinGecko', getCoinGeckoRates),
      getCachedRates('coinbase', getCoinbaseRates),
      getCachedRates('kucoin', getKucoinRates)
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
        dex: "Kucoin",
        price: kucoinRates.ethereum * 100,
        timestamp: Math.floor(Date.now() / 1000)
      }
    ];

    res.json(formattedRates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ETH rates' });
  }
});



async function getCoinGeckoRates(): Promise<CryptoRates> {
  const [ethResponse, btcResponse] = await Promise.all([
    axios.get('https://api.coingecko.com/api/v3/coins/ethereum', {
      headers: {
        'accept': 'application/json',
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
      }
    }),
    axios.get('https://api.coingecko.com/api/v3/exchange_rates', {
      headers: {
        'accept': 'application/json',
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
      }
    })
  ]);

  return {
    bitcoin: btcResponse.data.rates.usd.value,
    ethereum: ethResponse.data.market_data.current_price.usd,
    source: 'CoinGecko'
  };
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

async function getKucoinRates(): Promise<CryptoRates> {
  try {
  const [btcResponse, ethResponse] = await Promise.all([
    axios.get('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT'),
    axios.get('https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=ETH-USDT')
  ]);
  
  return {
    bitcoin: parseFloat(btcResponse.data.data.price),
    ethereum: parseFloat(ethResponse.data.data.price),
    source: 'KuCoin'
  };
} catch (error : any) {
  console.error('Error fetching KuCoin rates:', error.message);
  throw error;
}
}


app.listen(port, () => {
  console.log(`Kernel server running at http://localhost:${port}`);
});