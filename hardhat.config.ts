import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "hardhat-deploy";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    arbitrumSepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}` || "",
      accounts:
        process.env.PRIVATE_KEY_ARBITRUM !== undefined
          ? [process.env.PRIVATE_KEY_ARBITRUM]
          : [],
    },
  },
};

export default config;