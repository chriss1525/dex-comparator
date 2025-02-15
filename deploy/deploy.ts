import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  // Replace with the actual KRNL address and Kernel ID on Arbitrum Sepolia
  const krnlAddress = "0x0E709e842A7126FFf74F22041Ff10A38e8348e76";
  const kernelId = 341;
  const tokenAuthority = "0x0000000000000000000000000000000000000000";

  const deployResult = await deploy("DexPriceComparator", {
    from: deployer,
    args: [krnlAddress, kernelId, tokenAuthority],
    log: true,
    waitConfirmations: 1,
  });

  // Get the deployed contract
  const dexPriceComparator = await ethers.getContractAt("DexPriceComparator", deployResult.address);

  // Set KRNL Address, ID and Token Authority if needed.
  await dexPriceComparator.setKRNLAddress(krnlAddress);
  await dexPriceComparator.setKernelId(kernelId);
  await dexPriceComparator.setTokenAuthority(tokenAuthority);
};

deploy.tags = ["DexPriceComparator"];

export default deploy;
