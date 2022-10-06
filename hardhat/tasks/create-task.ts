
import { BytesLike, ethers, Wallet } from 'ethers';
import { task } from 'hardhat/config';
import { ops_abi } from '../data/ops_abi';
import { IOps } from '../typechain-types/gelato/IOps';
import * as dotenv from 'dotenv';
import { resolve} from 'path';
import { encode } from '@msgpack/msgpack';
import { parseEther } from 'ethers/lib/utils';
import { gelato_treasury_abi } from '../data/gelato_treasury_abi';
import { ipfsHash } from '../data/ipfsHash';
import { Lock__factory } from '../typechain-types/factories';
dotenv.config();
require('dotenv').config({ path: resolve(__dirname, '../.env') })


task('create-task', 'create gelato task goerli').setAction(async ({}, hre) => { 

    let ops = "0x03E739ff088825f91fa53c35279F632d038FB081"; //"0xc1C6805B857Bef1f412519C4A842522431aFed39";
    let opsTreasury = "0xa620799451Fab255A16550776c08Bc461C8F0aBE"; // off chain branch
    const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const ZERO_ADD = hre.ethers.constants.AddressZero;


    const owner_provider = hre.ethers.provider;
    const privKeyowner = process.env['PK'] as BytesLike;
    const owner_wallet = new Wallet(privKeyowner);
    const owner = await owner_wallet.connect(owner_provider);

    console.log(owner.address);

    let opsContract= new hre.ethers.Contract(ops, ops_abi,owner)  as IOps// await IOps__factory.connect(ops, owner);


    
    let treasury = new ethers.Contract(
        opsTreasury,
        gelato_treasury_abi,
        owner
      ) 

      let amount = parseEther("0.1");


      let tx = await treasury.depositFunds(owner.address, ETH, amount, {
        value: amount,
      });

      await tx.wait();
 
      let expectedData = new Lock__factory().interface.encodeFunctionData(
        "resolverUnLock"
      );

      let execSelector = new Lock__factory().interface.getSighash(
        "resolverUnLock"
      );
      let userArgs: { even:boolean } = {even: true };
      let userArgsBuffer = encode(userArgs);
      let hexargs = `0x${Buffer.from(userArgsBuffer).toString("hex")}`;
   

      let oResolverArgs  = ethers.utils.defaultAbiCoder.encode(
        ["string", "bytes"],
        [ipfsHash, hexargs]
      );

      let moduleData = {
        modules: [4],
        args: [oResolverArgs],
      };

      tx = await opsContract.createTask(
        "0xd73B3BC2707bAd4e02FFa8D5bAC2C15C014DcF45",
        execSelector,
        moduleData,
        ZERO_ADD,
        { gasLimit: 1000000 }
      );

      await tx.wait();

    


})