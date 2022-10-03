import { Framework } from "@superfluid-finance/sdk-core";
import { ethers } from "hardhat";

import { BytesLike, Wallet } from "ethers";
import {resolve} from 'path';
require('dotenv').config({ path: resolve(__dirname, '../.env') })

async function startStream() {

  let provider = ethers.provider;

  const sf = await Framework.create({
    chainId:5,//31337,
    provider: provider,
    customSubgraphQueriesEndpoint: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-goerli',
   // resolverAddress: '0x3710AB3fDE2B61736B8BB0CE845D6c61F667a78E',

  });


  try {

    // const accounts = await ethers.getSigners(); // This returns an array of the default signers connected to the hre's ethers instance
    // const deployer = accounts[0];
    // const user1 = accounts[1];
    // const user2 = accounts[2];


    const privKeyDEPLOYER = process.env['DEPLOYER_KEY'] as BytesLike;
    const deployer_wallet = new Wallet(privKeyDEPLOYER);
    const deployer = await deployer_wallet.connect(provider);

    



    const privKeyUSER = process.env['USER1_KEY'] as BytesLike;
    const user_wallet = new Wallet(privKeyUSER);
    const user1 = await user_wallet.connect(provider);

    let flowRate = '3858024691358';

    const createFlowOperation = sf.cfaV1.createFlow({
      flowRate,
      receiver: user1.address,
      superToken: "0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00"
      // userData?: string
    });

  const result = await createFlowOperation.exec(deployer);
  console.log(result);

  console.log(
    `Congrats - you've just created a money stream!
  View Your Stream At: https://app.superfluid.finance/dashboard/${user1.address}
  Network: Goerli
  Super Token: DAIx
  Sender: 0xDCB45e4f6762C3D7C61a00e96Fb94ADb7Cf27721
  Receiver: ${user1.address},
  FlowRate: ${flowRate}
  `
  );


} catch (error) {
  console.log(
    "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
  );
  console.error(error);
}

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
startStream().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
