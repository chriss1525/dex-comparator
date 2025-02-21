"use client";

declare global {
  interface Window {
    ethereum: any;
  }
}

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
  const [isConnected, setIsConnected] = useState(false);
  const [hasMetamask, setHasMetamask] = useState(false);
  const [signer, setSigner] = useState(undefined);
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
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
  };

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
  }, []);

  useEffect(() => {
    console.log("Effect running...");

    const fetchPrice = async () => {
      console.log("Fetching price...");

      const entryId = process.env.NEXT_PUBLIC_ENTRY_ID;
      const accessToken = process.env.NEXT_PUBLIC_KRNL_ACCESS_TOKEN;
      const RPC_URL = "https://v0-0-1-rpc.node.lat";
      const walletAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS;
      const smartContractAddress = "0xdD870eB3378cfae3E7beE375279aB22cf5712401";

      let currentAccount = null;

      console.log("Entry ID:", entryId);
      console.log("Access Token:", accessToken);
      console.log("Wallet Address:", walletAddress);
      console.log("Smart Contract Address:", smartContractAddress);

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = new ethers.JsonRpcSigner(
        provider,
        account || walletAddress || "",
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

        // const data = await provider.getKernelsCost(entryId);
        console.log("signer", signer.address);

        const abiEncodedString = AbiCoder.defaultAbiCoder().encode(
          ["string"],
          ["BTC/USD"],
        );

        console.log("Before executeKernels:");
        console.log("entryId:", entryId);
        console.log("accessToken:", accessToken);
        console.log("walletAddress:", walletAddress);
        console.log("abiEncodedString:", abiEncodedString);

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

        console.log("Raw Kernel Response:");
        console.log("auth:", executionResult.auth);
        console.log("kernel_responses:", executionResult.kernel_responses);
        console.log("kernel_params:", executionResult.kernel_params);

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

        console.log("Calling updateSavedRate with:");
        console.log("krnlPayload:", JSON.stringify(krnlPayload)); // VERY IMPORTANT
        console.log("TokenMapping.BTC:", TokenMapping.BTC);

        let tx: any;

        try {
          const updateSavedRate = contract.getFunction("updateSavedRate");

          console.log(await contract.getAddress());

          if (updateSavedRate) {
            console.log("kernelPayload", krnlPayload);
            console.log("Token mapping", 1);
            tx = await updateSavedRate(krnlPayload, TokenMapping.BTC);
          }
          await tx.wait();
          console.log("Transaction successful! Transaction hash:", tx.hash);

          const savedRate = await contract.getSavedRate(TokenMapping.BTC);
          console.log("Updated BTC Rate:", savedRate.toString());
          setPrice(savedRate);
        } catch (e) {
          console.error(e);
        }
        console.log("getting price ...");
        console.log("encodedPrice", tx);

        // if (tx) {
        //   const decodedPrice = AbiCoder.defaultAbiCoder().decode(
        //     ["uint256"],
        //     tx,
        //   );
        //   console.log("decodedPrice", decodedPrice);
        //   setPrice(decodedPrice[0]);
        // } else {
        //   console.log(error);
        //   throw new Error("No data received from getKernelsCost");
        // }
      } catch (error) {
        if (error instanceof Error) {
          return { error: error.message };
        } else {
          return { error: "An unknown error occurred" };
        }
      }
    };
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
  }, [account]);

  return (
    <div>
      <h1>DEX Price Comparison (Demonstration)</h1>
      {hasMetamask ? (
        !isConnected ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <p>Connected account: {account}</p>
        )
      ) : (
        <p>Please install MetaMask</p>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
      {price && <p>Price: {price.toFixed(4)}</p>}
      {loading && <p>Loading...</p>}

      {!isConnected && <p>Connect your wallet to see the price</p>}

      <p>
        <b>Note:</b> This is a demonstration. Real DEX price comparison requires
        a smart contract with functions to retrieve prices from different
        sources.
      </p>
    </div>
  );
}
