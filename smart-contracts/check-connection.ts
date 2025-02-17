import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Connected with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    const network = await hre.ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId);

    // Test connection to Arbitrum Sepolia (if configured)
    if (hre.network.name === "arbitrumSepolia") {
      console.log("Successfully connected to Arbitrum Sepolia!");
    }

  } catch (error) {
    console.error("Connection Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
