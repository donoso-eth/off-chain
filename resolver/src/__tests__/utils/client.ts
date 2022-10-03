
import { PolywrapClient } from "@polywrap/client-js";
import { ethereumPlugin } from "@polywrap/ethereum-plugin-js";

import {resolve} from 'path';
require('dotenv').config({ path: resolve(__dirname, '../.env') })

const env = process.env;

const chain = env.CHAINID ?? "testnet";
const provider = env.RPC_URL!;

const polywrapClient = new PolywrapClient({
  plugins: [
    {
      uri: "ens/ethereum.polywrap.eth",
      plugin: ethereumPlugin({
        networks: {
          [chain]: { provider },
        },
        defaultNetwork: chain,
      }),
    },
  ],
});

export default polywrapClient;
