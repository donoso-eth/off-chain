import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS =  60;
  const ops ="0xc1C6805B857Bef1f412519C4A842522431aFed39";
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const lockedAmount = ethers.utils.parseEther("0.1");

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime,ops, { value: lockedAmount });

  await lock.deployed();

  console.log(`Lock with 1 ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
