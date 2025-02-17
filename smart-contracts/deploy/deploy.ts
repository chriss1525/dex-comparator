import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying to network: ${network.name}`);

  let tokenAuthorityAddress: string;

  // Deploy TokenAuthority to Sapphire Oasis
  if (network.name === "sapphire-testnet") {
    console.log("Deploying TokenAuthority to Sapphire Oasis...");
    const tokenAuthorityDeployResult = await deploy("TokenAuthority", {
      from: deployer,
      args: [deployer], // initialOwner
      log: true,
      waitConfirmations: 1,
    });
    tokenAuthorityAddress = tokenAuthorityDeployResult.address;
    console.log(`TokenAuthority deployed to: ${tokenAuthorityAddress}`);
  } else {
    // If not on Sapphire, use a mock address or skip deployment
    tokenAuthorityAddress = "0x0000000000000000000000000000000000000000"; // Or skip deployment entirely
    console.log("Skipping TokenAuthority deployment (not on Sapphire)");
  }

  // Deploy DexPriceComparator to Sepolia
  if (network.name === "sepolia") {
    console.log("Deploying DexPriceComparator to Sepolia...");

    const dexPriceComparatorDeployResult = await deploy("DexPriceComparator", {
      from: deployer,
      log: true,
      waitConfirmations: 1,
    });

    console.log(`DexPriceComparator deployed to: ${dexPriceComparatorDeployResult.address}`);

    // Get the deployed contract
    const dexPriceComparator = await ethers.getContractAt("DexPriceComparator", dexPriceComparatorDeployResult.address);

  } else {
    console.log("Skipping DexPriceComparator deployment (not on Sepolia)");
  }
};

deploy.tags = ["DexPriceComparator", "TokenAuthority"];

export default deploy;