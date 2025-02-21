"use client";

import React, { useCallback, useState, useEffect } from "react";
import { ethers } from "krnl-sdk";
import { AbiCoder } from "krnl-sdk";
import ContractABI from "../abis/dexPriceComparor.json";

declare global {
  interface Window {
    ethereum: any;
  }
}
const TokenMapping = {
  ETH: 0,
  BTC: 1,
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasMetamask, setHasMetamask] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [price, setPrice] = useState<number | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const [selectedToken, setSelectedToken] = useState<"BTC" | "ETH">("BTC");

  const [dexPrices, setDexPrices] = useState<
    {
      name: string;
      price: number;
      spread: number;
    }[]
  >([]);
  const [bestDexIndex, setBestDexIndex] = useState<number>(0);
  const [bestPrice, setBestPrice] = useState<number>(0);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setIsConnected(true);
        setHasMetamask(true);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      console.log("Please install MetaMask!");
    }
  }, []);

  const fetchPrice = useCallback(async () => {
    setLoading(true);
    const entryId = process.env.NEXT_PUBLIC_ENTRY_ID;
    const accessToken = process.env.NEXT_PUBLIC_KRNL_ACCESS_TOKEN;
    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    const RPC_URL = "https://v0-0-1-rpc.node.lat";
    const smartContractAddress = "0xdD870eB3378cfae3E7beE375279aB22cf5712401";

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    if (!privateKey) {
      throw new Error("Private key is not defined");
    }

    const walletAddress = new ethers.Wallet(privateKey);
    const signer = new ethers.Wallet(privateKey, provider);

    const contract = new ethers.Contract(
      smartContractAddress,
      ContractABI,
      signer,
    );

    try {
      if (!entryId) {
        throw new Error("Entry ID is not defined");
      }

      if (!accessToken) {
        throw new Error("Access token is not defined");
      }

      if (!walletAddress) {
        throw new Error("Wallet address is not defined");
      }

      const abiEncodedString = AbiCoder.defaultAbiCoder().encode(
        ["string"],
        [`${selectedToken}/USD`],
      );

      const functionParams = AbiCoder.defaultAbiCoder().encode(
        ["uint8"],
        [TokenMapping[selectedToken].toString()],
      );

      const executionResult = await provider.executeKernels(
        entryId,
        accessToken,
        {
          senderAddress: walletAddress.address,
          kernelPayload: {
            "341": {
              // @ts-ignore
              functionParams: abiEncodedString,
            },
          },
        },
        functionParams,
      );

      const krnlPayload = {
        auth: executionResult.auth,
        kernelResponses: executionResult.kernel_responses,
        kernelParams: executionResult.kernel_params,
      };

      let tx: any;

      try {
        const updateSavedRate = contract.getFunction("updateSavedRate");

        if (updateSavedRate) {
          tx = await updateSavedRate(krnlPayload, functionParams);
        }

        const savedRate = await contract.getSavedRate(
          TokenMapping[selectedToken],
        );
        console.log("savedRate", savedRate);
        setPrice(savedRate);
      } catch (e) {
        console.error(e);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      } else {
        return { error: "An unknown error occurred" };
      }
    } finally {
      setLoading(false);
    }
  }, [ethers, selectedToken]);

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
  }, []);

  useEffect(() => {
    if (account) {
      setLoading(true);
      fetchPrice()
        .then((result) => {
          if (result?.error) setError(result.error);
          setLoading(false);
        })
        .catch((error) => {
          setError(error.message);
          setLoading(false);
        });
    }
  }, [account, selectedToken, ethers]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          🚀 Multi-DEX Price Comparison
        </h1>

        {/* Wallet Connection Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          {hasMetamask ? (
            !isConnected ? (
              <button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                🔗 Connect MetaMask
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-green-500">●</span>
                <p className="text-gray-600">
                  Connected:{" "}
                  <span className="font-mono">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                </p>
              </div>
            )
          ) : (
            <p className="text-red-500">Please install MetaMask</p>
          )}
        </div>

        {/* Token Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-gray-700">Select Token:</span>
            <div className="flex space-x-2">
              {["BTC", "ETH"].map((token) => (
                <button
                  key={token}
                  onClick={() => setSelectedToken(token as "BTC" | "ETH")}
                  className={`px-4 py-2 rounded-lg ${
                    selectedToken === token
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>

          {/* Price Refresh Control */}
          <button
            onClick={fetchPrice}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "⏳ Fetching Prices..." : "🔄 Refresh Prices"}
          </button>
        </div>

        {/* DEX Price Comparison */}
        {Boolean(price) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {selectedToken} Prices Across DEXs
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dexPrices.map((dex, index) => (
                <div key={dex.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{dex.name}</h3>
                    <span className="text-sm text-gray-500">
                      Spread: {dex.spread}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    ${dex.price.toFixed(2)}
                  </div>
                  <div
                    className={`text-sm ${
                      index === bestDexIndex ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {index === bestDexIndex
                      ? "Best Value"
                      : `$${(dex.price - bestPrice).toFixed(2)} difference`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational Section */}
        <div className="bg-blue-50 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            💡 How It Works
          </h2>
          <p className="text-gray-600">
            We compare {selectedToken} prices across multiple decentralized
            exchanges (DEXs) to help you find the best trading price. The{" "}
            <span className="text-green-600">"Best Value"</span>
            indicator shows which DEX currently offers the most favorable rate
            for your {selectedToken}
            transactions.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            ⚠️ Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
