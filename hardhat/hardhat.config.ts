import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv';
import { resolve} from 'path';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';

dotenv.config();
require('dotenv').config({ path: resolve(__dirname, '../.env') })
const INFURA_ID = process.env["INFURA_ID"];

const defaultNetwork = "localhost";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork,
  networks: {
    hardhat: {
      forking: {
        url: `https://goerli.infura.io/v3/${INFURA_ID}`,
        blockNumber: 7704180
      
      },
    },
    localhost: {
      url: 'http://localhost:8545',
      chainId: 31337,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_ID}`,
      gasPrice: 1000000000,
      accounts: [process.env["PK"] as string],
    },
  },
};

export default config;
