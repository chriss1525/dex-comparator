"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const port = 3000;
// Main endpoint that will be called as a kernel
app.get('/rates/:token', async (req, res) => {
    const tokenType = req.params.token; // "BTC" or "ETH"
    try {
        const [coinGeckoRates, coinbaseRates, binanceRates] = await Promise.all([
            getCoinGeckoRates(),
            getCoinbaseRates(),
            getBinanceRates()
        ]);
        // Format rates to match what the contract expects, now including dex identifier
        const formattedRates = [
            {
                dex: "CoinGecko",
                price: tokenType === "BTC" ? coinGeckoRates.bitcoin * 100 : coinGeckoRates.ethereum * 100,
                timestamp: Math.floor(Date.now() / 1000)
            },
            {
                dex: "Coinbase",
                price: tokenType === "BTC" ? coinbaseRates.bitcoin * 100 : coinbaseRates.ethereum * 100,
                timestamp: Math.floor(Date.now() / 1000)
            },
            {
                dex: "Binance",
                price: tokenType === "BTC" ? binanceRates.bitcoin * 100 : binanceRates.ethereum * 100,
                timestamp: Math.floor(Date.now() / 1000)
            }
        ];
        res.json(formattedRates);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch rates' });
    }
});
// Keep existing exchange fetching functions
async function getCoinGeckoRates() {
    const response = await axios_1.default.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    return {
        bitcoin: response.data.bitcoin.usd,
        ethereum: response.data.ethereum.usd,
        source: 'CoinGecko'
    };
}
async function getCoinbaseRates() {
    const btcResponse = await axios_1.default.get('https://api.coinbase.com/v2/prices/BTC-USD/spot');
    const ethResponse = await axios_1.default.get('https://api.coinbase.com/v2/prices/ETH-USD/spot');
    return {
        bitcoin: parseFloat(btcResponse.data.data.amount),
        ethereum: parseFloat(ethResponse.data.data.amount),
        source: 'Coinbase'
    };
}
async function getBinanceRates() {
    const btcResponse = await axios_1.default.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const ethResponse = await axios_1.default.get('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
    return {
        bitcoin: parseFloat(btcResponse.data.price),
        ethereum: parseFloat(ethResponse.data.price),
        source: 'Binance'
    };
}
app.listen(port, () => {
    console.log(`Kernel server running at http://localhost:${port}`);
});
