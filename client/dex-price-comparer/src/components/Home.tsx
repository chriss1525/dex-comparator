"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "krnl-sdk";
import { AbiCoder } from "krnl-sdk";
import ContractABI from "../abis/dexPriceComparor.json";

const TokenMapping = {
  ETH: 0,
  BTC: 1,
};
export default function Home() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Effect running...");

    const fetchPrice = async () => {
      console.log("Fetching price...");

      const entryId = process.env.NEXT_PUBLIC_ENTRY_ID;
      const accessToken = process.env.NEXT_PUBLIC_KRNL_ACCESS_TOKEN;
      const RPC_URL = "https://v0-0-1-rpc.node.lat/";
      const walletAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS;
      const smartContractAddress = "0xdD870eB3378cfae3E7beE375279aB22cf5712401";

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

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const signer = new ethers.JsonRpcSigner(provider, walletAddress);

        // const data = await provider.getKernelsCost(entryId);
        console.log("signer", signer.address);

        const abiEncodedString = AbiCoder.defaultAbiCoder().encode(
          ["string"],
          ["BTC/USD"],
        );

        const executionResult = await provider.executeKernels(
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
          abiEncodedString,
        );

        console.log("executing kernel method ...");

        const contract = new ethers.Contract(
          smartContractAddress,
          ContractABI,
          signer,
        );

        console.log("contract", contract);
        console.log("kernelPrams are", executionResult.kernel_params);
        console.log("kernel resonse is", executionResult.kernel_responses);

        const krnlPayload = {
          auth: executionResult.auth,
          kernelResponses: executionResult.kernel_responses,
          kernelParams: executionResult.kernel_params,
        };

        console.log("krnlPayload", krnlPayload);
        console.log("signature token is", krnlPayload.auth);

        let tx: any;

        try {
          const updateSavedRate = contract.getFunction("updateSavedRate");

          console.log(await contract.getAddress());

          if (updateSavedRate) {
            tx = await updateSavedRate(
              [
                krnlPayload.auth,
                krnlPayload.kernelResponses,
                krnlPayload.kernelParams,
              ],
              TokenMapping.BTC,
            );
          }
          await tx.wait();
        } catch (e) {
          console.error(e);
        }
        console.log("getting price ...");
        console.log("encodedPrice", tx);

        if (tx) {
          const decodedPrice = AbiCoder.defaultAbiCoder().decode(
            ["uint256"],
            tx,
          );
          console.log("decodedPrice", decodedPrice);
          setPrice(decodedPrice[0]);
        } else {
          console.log(error);
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
    fetchPrice()
      .then((result) => {
        if (result?.error) setError(result.error);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
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
