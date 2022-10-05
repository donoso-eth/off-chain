import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { encode } from "@msgpack/msgpack";
import { Lock__factory } from "../typechain-types/factories";

import { PolywrapClient } from "@polywrap/client-js";
import { IOps__factory } from "../typechain-types/factories/gelato";
import { IOps } from "../typechain-types/gelato/IOps";
import { ethers } from "hardhat";
import {encodeOffModulerArgs, Module} from './helpers/module'

import { ipfsHash} from '../data/ipfsHash'


let ops = "0x03E739ff088825f91fa53c35279F632d038FB081"//"0xc1C6805B857Bef1f412519C4A842522431aFed39";
let opsExec = "0x683913B3A32ada4F8100458A3E1675425BdAa7DF";
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

describe("Lock Resolver", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock") 
    const lock = (await Lock.deploy(unlockTime, ops, { value: lockedAmount }));;

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should Unlock when calling off calling resolver with a even number", async function () {
        const { lock, unlockTime, owner,otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        
    

        let opsContract:IOps = await IOps__factory.connect(ops, owner)

        let expectedData = new Lock__factory().interface.encodeFunctionData(
          "resolverUnLock"
        );

        let execSelector = new Lock__factory().interface.getSighash("resolverUnLock");
        let userArgs: { guess: string } = { guess: "9" };
        let userArgsBuffer = encode(userArgs);
        let hexargs = `0x${Buffer.from(userArgsBuffer).toString("hex")}`;

        let oResolverArgs = encodeOffModulerArgs(ipfsHash,hexargs)

        let moduleData = {
          modules: [Module.ORESOLVER],
          args: [oResolverArgs],
        };

   
       let tx = await opsContract.createTask(lock.address,execSelector,moduleData,ETH,{gasLimit:1000000});

       await tx.wait();

        const polywrapClient = new PolywrapClient({
          plugins: [],
        });

        //// import client
        const wrapperUri = `wrap://ipfs/${ipfsHash}` //`fs/${wrapperPath}/build`;

        const gelatoArgs = {
          gasPrice: ethers.utils.parseUnits("100", "gwei").toString(),
          timeStamp: Math.floor(Date.now() / 1000).toString(),
        };

       
      
        let gelatoArgsBuffer = encode(gelatoArgs);

        let job = await polywrapClient.invoke({
          uri: wrapperUri,
          method: "checker",
          args: {
            userArgsBuffer,
            gelatoArgsBuffer,
          },
        });

        let error = job.error;
        let data = <{ canExec: Boolean; execData: String }>job.data;

        expect(data?.canExec).to.be.false;
        expect(data?.execData).to.be.equal("");

        //// call with guess = 10 should return can exec = true
        userArgs = { guess: "12" };

        userArgsBuffer = encode(userArgs);
        gelatoArgsBuffer = encode(gelatoArgs);

        job = await polywrapClient.invoke({
          uri: wrapperUri,
          method: "checker",
          args: {
            userArgsBuffer,
            gelatoArgsBuffer,
          },
        });

        error = job.error;

        data = <{ canExec: Boolean; execData: String }>job.data;

    

        expect(data?.canExec).to.be.true;
        expect(data?.execData).to.be.equal(expectedData);

        ///// Gelato execution

        if (data?.canExec == true) {
        }

        // We use lock.connect() to send a transaction from another account
      });

 
    });


  });
});
