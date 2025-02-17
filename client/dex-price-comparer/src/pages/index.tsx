// src/pages/index.tsx
import React, { useState, useEffect } from "react";
import { ethers } from "krnl-sdk";
import { AbiCoder } from "krnl-sdk";

function Home() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Effect running...");

    const fetchPrice = async () => {
      console.log("Fetching price...");

      const entryId = process.env.NEXT_PUBLIC_ENTRY_ID;
      const accessToken = process.env.NEXT_PUBLIC_KRNL_ACCESS_TOKEN;
      const infuraApiKey = process.env.NEXT_PUBLIC_INFURA_API_KEY;
      const walletAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS;

      try {
        if (!entryId) {
          throw new Error("Entry ID is not defined");
        }

        if (!accessToken) {
          throw new Error("Access token is not defined");
        }

        if (!infuraApiKey) {
          throw new Error("Infura API key is not defined");
        }

        if (!walletAddress) {
          throw new Error("Wallet address is not defined");
        }

        const provider = new ethers.JsonRpcProvider(
          `https://sepolia.infura.io/v3/${infuraApiKey}`
        );

        // const data = await provider.getKernelsCost(entryId);

        const abiEncodedString = AbiCoder.defaultAbiCoder().encode(
          ["string"],
          ["BTC/USD"]
        );


        const data = await provider.executeKernels(
          entryId,
          accessToken,
          {
            senderAddress: walletAddress,
            kernelPayload: {
              "341": {
                functionParams: abiEncodedString,
              },
            },
          },
          abiEncodedString
        );

        if (data) {
          return { data };
        } else {
          throw new Error("No data received from getKernelsCost");
        }
      } catch (error) {
        if (error instanceof Error) {
          return { error: error.message };
        } else {
          return { error: "An unknown error occurred" };
        }
      }
    };

    setLoading(true);
    fetchPrice().then((result) => {
      if (result.data) {
        setPrice(+result.data.kernel_responses);
      } else {
        setError(result.error);
      }
      setLoading(false);
      console.log("Price fetched:", result.data);
      console.log("Error:", result.error);
    });
  }, []);

  return (
    <div>
      <h1>DEX Price Comparison (Demonstration)</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {price && <p>Price: {price.toFixed(4)}</p>}
      {loading && <p>Loading...</p>}

      <p>
        <b>Note:</b> This is a demonstration. Real DEX price comparison requires
        a smart contract with functions to retrieve prices from different
        sources.
      </p>
    </div>
  );
}

export default Home;
