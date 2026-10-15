require('dotenv').config();
require('@nomicfoundation/hardhat-ethers');
const key = process.env.DEPLOYER_PRIVATE_KEY;
module.exports = {
  solidity: {
  version: "0.8.26",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    evmVersion: "cancun"
  }
},
  networks: {
    hardhat: {},
    baseSepolia: {url:process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',chainId:84532,accounts:key ? [key] : []}
  }
};
