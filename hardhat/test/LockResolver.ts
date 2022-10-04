import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { encode } from "@msgpack/msgpack";

import { Lock__factory } from "../typechain-types/factories";

import { PolywrapClient } from "@polywrap/client-js";
import { IOps__factory } from "../typechain-types/factories/gelato";
import { IOps } from "../typechain-types/gelato/IOps";

let ops = "0xc1C6805B857Bef1f412519C4A842522431aFed39";
let opsExec = "0x683913B3A32ada4F8100458A3E1675425BdAa7DF";

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
    const lock = (await Lock.deploy(unlockTime, ops, { value: lockedAmount })) as Lock;;

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



        


        const polywrapClient = new PolywrapClient({
          plugins: [],
        });

        //// import client
        const wrapperUri =
          "wrap://ipfs/QmV8LdTComhHuRh2GMVQJv85KTn1mXahCy7ifAtJHkYABk"; //`fs/${wrapperPath}/build`;

        const gelatoArgs = {
          gasPrice: ethers.utils.parseUnits("100", "gwei").toString(),
          timeStamp: Math.floor(Date.now() / 1000).toString(),
        };

        let userArgs: { guess: string } = { guess: "9" };

        let userArgsBuffer = encode(userArgs);
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

        let expectedData = new Lock__factory().interface.encodeFunctionData(
          "resolverUnLock"
        );

        expect(data?.canExec).to.be.true;
        expect(data?.execData).to.be.equal(expectedData);

        ///// Gelato execution

        if (data?.canExec == true) {
        }

        // We use lock.connect() to send a transaction from another account
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});
