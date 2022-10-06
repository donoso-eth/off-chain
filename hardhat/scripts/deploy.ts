import { ethers } from "hardhat";
// import { time } from "@nomicfoundation/hardhat-network-helpers";
import { join} from 'path';
import {copyFileSync, writeFileSync} from 'fs-extra'

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const ops ="0x03E739ff088825f91fa53c35279F632d038FB081";
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;
  console.log(unlockTime)
  //const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
  const lockedAmount = ethers.utils.parseEther("0.1");

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime,ops, { value: lockedAmount }); 

  await lock.deployed();

  console.log(`Lock with 0.1 ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`);

  let execData = lock.interface.encodeFunctionData(
    "resolverUnLock"
  );

console.log(execData)

  writeFileSync(join(process.cwd(),"../resolver/src/contract/execData.ts"),`export const  execData = "${execData}";`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
