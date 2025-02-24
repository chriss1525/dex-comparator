import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";

import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28", // Oasis supports up to 0.8.24
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // set to true for TA
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY_SEPOLIA}`],
    },
    "sapphire-testnet": {
      url: `https://testnet.sapphire.oasis.io`,
      chainId: 23295,
      accounts: [`0x${process.env.PRIVATE_KEY_OASIS}`],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
