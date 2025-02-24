"use client";
import React, { useCallback, useState, useEffect } from "react";
import { ethers } from "krnl-sdk";
import ContractABI from "../abis/dexPriceComparor.json";

declare global {
  interface Window {
    ethereum: any;
  }
}

interface DexPrice {
  name: string;
  btcPrice: number;
  ethPrice: number;
  timestamp: number;
}

const CONTRACT_ADDRESS = "0x5653CE584604792237420B9D9bfF3D2197Ec1fdc";
const RPC_URL = "https://v0-0-1-rpc.node.lat";

export default function Home() {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [account, setAccount] = useState("");
  const [prices, setPrices] = useState<DexPrice[]>([]);
  const [bestDeal, setBestDeal] = useState("");

  // Initialize ethers components once
  const getEthers = useCallback(() => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(
      process.env.NEXT_PUBLIC_PRIVATE_KEY!,
      provider,
    );
    return {
      contract: new ethers.Contract(CONTRACT_ADDRESS, ContractABI, signer),
      signer,
      provider,
    };
  }, []);

  // Wallet connection handler
  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not installed");

      const [account] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(account);
      await refreshPrices();
    } catch (err) {
      if (err instanceof Error) {
        setError(`Wallet error: ${err.message}`);
      }
    }
  }, []);

  // Unified price update handler
  const updateAllPrices = useCallback(async () => {
    const { contract, signer } = getEthers();
    setLoading(true);
    setError("");

    try {
      // Process all DEXes sequentially

      if (!signer.provider) {
        setError("Wallet provider not available");
        return;
      }

      for (const dexName of ["Dex1", "Dex2", "Dex3"]) {
        // Update both tokens for each DEX
        for (const token of ["BTC", "ETH"]) {
          const feeData = await signer.provider.getFeeData();

          if (!feeData.gasPrice) {
            setError("fee gas price is not set");
            return;
          }

          const gasPrice =
            (BigInt(feeData.gasPrice.toString()) * BigInt(150)) / BigInt(100);

          // Execute kernel and send Transaction

          const executionResult = await signer.provider.executeKernels(
            process.env.NEXT_PUBLIC_ENTRY_ID!,
            process.env.NEXT_PUBLIC_KRNL_ACCESS_TOKEN!,
            {
              senderAddress: signer.address,
              kernelPayload: {
                "341": {
                  functionParams: ethers.AbiCoder.defaultAbiCoder().encode(
                    ["string"],
                    [`${token}/USD`],
                  ),
                },
              },
            },
            ethers.AbiCoder.defaultAbiCoder().encode(
              ["uint8"],
              [token === "BTC" ? 1 : 0],
            ),
          );

          const tx = await contract.updateDexRates(
            {
              auth: executionResult.auth,
              kernelResponses: executionResult.kernel_responses,
              kernelParams: executionResult.kernel_params,
            },
            dexName === "Dex1" ? 0 : dexName === "Dex2" ? 1 : 2,
            token === "BTC" ? 1 : 0,
            {
              gasLimit: 300000,
              gasPrice: `0x${gasPrice.toString(16)}`,
              nonce: await signer.getNonce(),
            },
          );

          await tx.wait();
        }
      }

      await refreshPrices();
    } catch (err) {
      if (err instanceof Error) {
        setError(`Transaction failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch and process rates
  const refreshPrices = useCallback(async () => {
    try {
      const { contract } = getEthers();
      const [ethRates, btcRates, timestamps] = await contract.getAllRates();

      // Convert BigInt values to numbers
      const processed = ethRates.map((eth: bigint, i: number) => ({
        name: `Dex${i + 1}`,
        ethPrice: Number(eth) / 100,
        btcPrice: Number(btcRates[i]) / 100,
        timestamp: Number(timestamps[i]),
      }));

      setPrices(processed);
      updateBestDeal(processed);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Data fetch failed: ${err.message}`);
      }
    }
  }, []);

  // Best deal calculation
  const updateBestDeal = useCallback((prices: DexPrice[]) => {
    const valid = prices.filter(
      (p) => Date.now() - p.timestamp * 1000 < 24 * 60 * 60 * 1000,
    );

    setBestDeal(
      valid.length
        ? valid.reduce((a, b) => (a.btcPrice < b.btcPrice ? a : b)).name
        : "",
    );
  }, []);

  // Auto-refresh on account change
  useEffect(() => {
    if (account) refreshPrices();
  }, [account]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Wallet Connection */}
      <div className="mb-8">
        {!account ? (
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-green-600">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        )}
      </div>

      {/* Price Update Control */}
      <button
        onClick={updateAllPrices}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded mb-8 disabled:opacity-50"
      >
        {loading ? "Updating Prices..." : "Refresh All Prices"}
      </button>

      {/* Price Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prices.map((dex) => (
          <div
            key={dex.name}
            className={`p-4 rounded-lg ${bestDeal === dex.name ? "bg-green-100" : "bg-white"}`}
          >
            <h3 className="text-xl font-bold mb-2">{dex.name}</h3>
            <div className="space-y-1">
              <p>BTC: ${dex.btcPrice.toFixed(2)}</p>
              <p>ETH: ${dex.ethPrice.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                Updated: {new Date(dex.timestamp * 1000).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
}
