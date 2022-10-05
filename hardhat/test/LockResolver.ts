import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { encode } from "@msgpack/msgpack";
import { Lock__factory } from "../typechain-types/factories";

import { PolywrapClient } from "@polywrap/client-js";
import { IOps__factory } from "../typechain-types/factories/gelato";
import { IOps } from "../typechain-types/gelato/IOps";
import { ethers, network } from "hardhat";
import { encodeOffModulerArgs, Module } from "./helpers/module";

import { ipfsHash } from "../data/ipfsHash";
import { Contract, utils } from "ethers";
import { gelato_treasury_abi } from "../data/gelato_treasury_abi";
import { ITaskTreasuryUpgradable } from "../typechain-types/gelato/ITaskTreasuryUpgradable";
import { Bytes, parseEther } from "ethers/lib/utils";

let ops = "0x03E739ff088825f91fa53c35279F632d038FB081"; //"0xc1C6805B857Bef1f412519C4A842522431aFed39";
let opsExec = "0x683913B3A32ada4F8100458A3E1675425BdAa7DF";
let opsTreasury = "0xa620799451Fab255A16550776c08Bc461C8F0aBE"; // off chain branch
const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO_ADD = ethers.constants.AddressZero;

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
    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, ops, { value: lockedAmount });

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
        const { lock, unlockTime, owner, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        let opsContract: IOps = await IOps__factory.connect(ops, owner);

        await network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [opsExec],
        });

        let executor = await ethers.provider.getSigner(opsExec);

        let treasury = new Contract(
          opsTreasury,
          gelato_treasury_abi,
          owner
        ) as ITaskTreasuryUpgradable;

        let amount = parseEther("0.1");

        let tx = await treasury.depositFunds(owner.address, ETH, amount, {
          value: amount,
        });



        let expectedData = new Lock__factory().interface.encodeFunctionData(
          "resolverUnLock"
        );

        let execSelector = new Lock__factory().interface.getSighash(
          "resolverUnLock"
        );
        let userArgs: { even:boolean } = {even: true };
        let userArgsBuffer = encode(userArgs);
        let hexargs = `0x${Buffer.from(userArgsBuffer).toString("hex")}`;
        let oResolverArgs = encodeOffModulerArgs(ipfsHash, hexargs);

        let moduleData = {
          modules: [Module.ORESOLVER],
          args: [oResolverArgs],
        };

        tx = await opsContract.createTask(
          lock.address,
          execSelector,
          moduleData,
          ZERO_ADD,
          { gasLimit: 1000000 }
        );

        await tx.wait();

        const polywrapClient = new PolywrapClient({
          plugins: [],
        });

        //// import client
        const wrapperUri = `wrap://ipfs/${ipfsHash}`; //`fs/${wrapperPath}/build`;

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
        let data = <{ canExec: Boolean; execData: Bytes}>job.data;

        expect(data?.canExec).to.be.false;
        expect(data?.execData).to.be.equal("");

        const encoded = ethers.utils.defaultAbiCoder.encode(
          ["address", "address", "bytes4", "tuple(uint8[], bytes[])", "address"],
          [
            owner.address,
            lock.address,
            execSelector,
            [moduleData.modules, moduleData.args],
            ZERO_ADD,
          ]
        );
      
        const taskId = ethers.utils.keccak256(encoded);
      

        let tasks = await opsContract.getTaskIdsByUser(owner.address)




        ///// Gelato execution

        if (data?.canExec == true) {
          let fee = utils.parseEther("0.1")
            await opsContract
              .connect(executor)
              .exec(
                owner.address,
                lock.address,
                data?.execData,
                moduleData,
                fee,
                ETH,
                true,
                true
              );
        }

        // We use lock.connect() to send a transaction from another account
      });
    });
  });
});
