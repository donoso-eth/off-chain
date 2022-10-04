// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Lock {
    uint public unlockTime;
    address payable public owner;
    address ops;
    event Withdrawal(uint amount, uint when);

    constructor(uint _unlockTime, address _ops) payable {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );
        ops = _ops;
        unlockTime = _unlockTime;
        owner = payable(msg.sender);
    }

    function resolverUnLock() external onlyOps {

        unlockTime = block.timestamp;


    }

    function withdraw() public {
       
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        owner.transfer(address(this).balance);
    }

    modifier onlyOps() {
    require(msg.sender == address(ops), "OpsReady: onlyOps");
    _;
  }

}
