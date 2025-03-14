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
    const [coinGeckoRates, coinbaseRates] = await Promise.all([
      getCoinGeckoRates(),
      getCoinbaseRates(),
      // getBinanceRates()
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
      // {
      //   dex: "Binance",
      //   price: binanceRates.bitcoin * 100,
      //   timestamp: Math.floor(Date.now() / 1000)
      // }
    ];

    res.json(formattedRates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch BTC rates' });
  }
});

// Get ETH rates endpoint
app.get('/eth', async (req, res) => {
  try {
    const [coinGeckoRates, coinbaseRates] = await Promise.all([
      getCoinGeckoRates(),
      getCoinbaseRates(),
      // getBinanceRates()
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
      // {
      //   dex: "Binance",
      //   price: binanceRates.ethereum * 100,
      //   timestamp: Math.floor(Date.now() / 1000)
      // }
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

async function getBinanceRates(): Promise<CryptoRates> {
  try {
    const btcResponse = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: { symbol: 'BTCUSDT' },
      headers: {
        'User-Agent': 'Your-App-Name/1.0'
      }
    });
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