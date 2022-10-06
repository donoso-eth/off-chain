import { utils } from 'ethers';
import { readFileSync } from 'fs-extra';
import { task } from 'hardhat/config';
import { join } from 'path';


task('verify-contract', 'verify').setAction(async ({}, hre) => {

  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const ops ="0x03E739ff088825f91fa53c35279F632d038FB081";
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;;
  const lockedAmount = utils.parseEther("0.1");

  await hre.run('verify:verify', {
    address: "0xd73B3BC2707bAd4e02FFa8D5bAC2C15C014DcF45",
    constructorArguments: [
      1696608448,ops ],
  });
});
