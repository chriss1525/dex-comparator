"use client";
import React, { useCallback, useState, useEffect } from "react";
import { ethers } from "krnl-sdk";
import ContractABI from "../abis/dexPriceComparor.json";
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

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

function Home() {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [account, setAccount] = useState("");
  const [prices, setPrices] = useState<DexPrice[]>([]);
  const [bestDeal, setBestDeal] = useState("");
  const [selectedToken, setSelectedToken] = useState<"BTC" | "ETH">("ETH");

  // Initialize ethers components once
  const getEthers = useCallback(() => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(
      process.env.NEXT_PUBLIC_PRIVATE_KEY!,
      provider
    );
    return {
      contract: new ethers.Contract(CONTRACT_ADDRESS, ContractABI, signer),
      signer,
      provider,
    };
  }, []);

  // Best deal calculation
  const updateBestDeal = useCallback(
    async (token: "BTC" | "ETH") => {
      const { contract } = getEthers();

      try {
        const [bestDex, bestPrice] = await contract.findBestDeal(
          token === "BTC" ? 1 : 0
        );

        const dexName = `Dex${Number(bestDex) + 1}`;
        setBestDeal(dexName);

        return {
          dex: dexName,
          price: Number(bestPrice) / 100,
        };
      } catch (err) {
        if (err instanceof Error) {
          setError(`Best deal calculation failed: ${err.message}`);
        }
        return null;
      }
    },
    [getEthers]
  );

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
      await updateBestDeal(selectedToken);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Data fetch failed: ${err.message}`);
      }
    }
  }, [selectedToken, getEthers, updateBestDeal]);

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
  }, [refreshPrices]);

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

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          const executionResult = await signer.provider.executeKernels(
            process.env.NEXT_PUBLIC_ENTRY_ID!,
            process.env.NEXT_PUBLIC_KRNL_ACCESS_TOKEN!,
            {
              senderAddress: signer.address,
              kernelPayload: {
                "341": {
                  // @ts-ignore
                  functionParams: ethers.AbiCoder.defaultAbiCoder().encode(
                    ["string"],
                    [`${token}/USD`]
                  ),
                },
              },
            },
            ethers.AbiCoder.defaultAbiCoder().encode(
              ["uint8"],
              [token === "BTC" ? 1 : 0]
            )
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
            }
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
  }, [getEthers, refreshPrices]);

  // Auto-refresh on account change
  useEffect(() => {
    if (account) refreshPrices();
  }, [account, refreshPrices]);

  useEffect(() => {
    updateBestDeal(selectedToken);
  }, [selectedToken, updateBestDeal]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Disclaimer */}
      <div className="bg-yellow-50 border-b border-yellow-200 py-2 text-center text-sm text-yellow-800 flex items-center justify-center gap-2">
        <InformationCircleIcon className="h-4 w-4" />
        <span>
          Disclaimer: The prices displayed are not real prices. This application
          uses a mock oracle for demonstration purposes.
        </span>
      </div>

      <div className="container mx-auto p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-2xl font-semibold text-gray-900">
            Platform Price Explorer
          </h1>
          <div>
            {!account ? (
              <button
                onClick={connectWallet}
                className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </div>
            )}
          </div>
        </div>

        {/* Token Selection */}
        <div className="mb-8">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setSelectedToken("ETH")}
              className={`py-2 px-4 rounded-full font-semibold transition-colors ${
                selectedToken === "ETH"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Ethereum (ETH)
            </button>
            <button
              onClick={() => setSelectedToken("BTC")}
              className={`py-2 px-4 rounded-full font-semibold transition-colors ${
                selectedToken === "BTC"
                  ? "bg-teal-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Bitcoin (BTC)
            </button>
          </div>
        </div>

        {/* Platform Price Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prices.map((platform) => (
            <div
              key={platform.name}
              className={`bg-white rounded-xl shadow-md p-6 transition-transform hover:scale-105 ${
                bestDeal === platform.name
                  ? "border-2 border-teal-500"
                  : "border border-gray-200"
              }`}
            >
              <h3 className="text-xl font-semibold mb-4">{platform.name}</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">
                  {selectedToken === "BTC" ? "BTC/USD" : "ETH/USD"}
                </span>
                <span className="text-lg font-bold">
                  $
                  {selectedToken === "BTC"
                    ? platform.btcPrice.toFixed(2)
                    : platform.ethPrice.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Last Updated:{" "}
                {new Date(platform.timestamp * 1000).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Best Deal Explanation */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <ArrowRightIcon className="h-6 w-6 text-teal-500" />
            How We Pick the Best Deal
          </h2>
          <p className="text-gray-700">
            We compare the prices of the selected token (ETH or BTC) across all
            available platforms. The platform with the lowest price is
            considered the best deal.
          </p>
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={updateAllPrices}
            disabled={loading}
            className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? "Updating Prices..." : "Refresh Prices"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 text-gray-600 fixed bottom-0 left-0 w-full" >
        &copy; {new Date().getFullYear()} Platform Price Explorer. All rights
        reserved.
      </footer>
    </div>
  );
}

export default Home;
