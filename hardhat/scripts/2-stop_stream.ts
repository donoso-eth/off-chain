import { Framework, Host, normalizeAddress } from "@superfluid-finance/sdk-core";
import { ethers, network } from "hardhat";
import * as dotenv from 'dotenv';
import { BytesLike, constants, Contract, utils, Wallet } from "ethers";
import { HOST_ABI } from "../data/host_abi";
import { CASH_AGREEMENT_ABI } from "../data/cashFlow_abi";
import { GelatoOpsSDK, Module, ModuleData, TaskTransaction } from "@gelatonetwork/ops-sdk";
import { IOps__factory } from "../typechain-types/factories/IOps__factory";
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

dotenv.config();

async function stopStream() {

  let provider = ethers.provider;
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

  const gelatoOps = new GelatoOpsSDK(5, deployer);

  
 
  const sf = await Framework.create({
    chainId: 5,//31337,
    provider: provider,
    //customSubgraphQueriesEndpoint: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-goerli',
   // resolverAddress: '0x3710AB3fDE2B61736B8BB0CE845D6c61F667a78E',

  });


  let host = "0x22ff293e14F1EC3A09B137e9e06084AFd63adDF9"
  let cfa = "0xEd6BcbF6907D4feEEe8a8875543249bEa9D308E8"
  let superToken = "0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00";

  let gelato ="0xc1C6805B857Bef1f412519C4A842522431aFed39"
let gelatoExec = "0x683913B3A32ada4F8100458A3E1675425BdAa7DF"


let tx;

  try {

    let auth = await sf.cfaV1.authorizeFlowOperatorWithFullControl({flowOperator:gelato,superToken:superToken})

    await auth.exec(deployer)


    // const createFlowOperation = sf.cfaV1.deleteFlow({
    //   sender: deployer.address,
    //   receiver: user1.address,
    //   superToken: "0xF2d68898557cCb2Cf4C10c3Ef2B034b2a69DAD00"
    //   // userData?: string
    // });
    
    // const result = await createFlowOperation.exec(deployer);
    

    


    const hostContract= new Contract(host,HOST_ABI,deployer)  ;

    const cfaInterface = new ethers.utils.Interface(
        CASH_AGREEMENT_ABI
    );
    const hostInterface = new ethers.utils.Interface(
      HOST_ABI
    )

  
    const cfaCallData = cfaInterface.encodeFunctionData(
      "deleteFlow",
      [superToken,deployer.address, user1.address,"0x" ]
    );


    const hostCallData = hostInterface.encodeFunctionData("callAgreement",
        [cfa,cfaCallData,"0x"]      
    )

 
    // const params =  [cfa,cfaCallData,"0x"] ;
    // const action = 'callAgreement';
    // const unsignedTx = await  hostContract.populateTransaction[action](...params);
    //  let tx = await deployer.sendTransaction(unsignedTx);


    //let tx = await deployer.sendTransaction({data:hostCallData})
     //await tx.wait()


   
      let execData = hostCallData;
      let execAddress = host;
      let startTime = +((new Date().getTime()/1000).toFixed(0))+ 300;
      let execSelector = hostContract.interface.getSighash(
        'callAgreement(address,bytes,bytes)'
      );
      const  { taskId, tx }: TaskTransaction = await gelatoOps.createTask({
        execAddress,
        execSelector,
        execData,
        name: "Automated stopping stream",
        dedicatedMsgSender:false,
        useTreasury:true,
        singleExec:true
      });
    
      // await tx.wait()

      // await network.provider.request({
      //   method: 'hardhat_impersonateAccount',
      //   params: [gelatoExec],
      // });
  
      // let executor = await ethers.provider.getSigner(gelatoExec);

      // await network.provider.request({
      //   method: 'hardhat_impersonateAccount',
      //   params: [gelato],
      // });

      // let gelatoOps = await ethers.provider.getSigner(gelato);

      //  tx = await gelatoOps.sendTransaction(unsignedTx);


      let ops = IOps__factory.connect(gelato, deployer);


      console.log('JUAJAJAJAJ')


      let fee = utils.parseEther("0.1")
      const moduleData: ModuleData = {
        modules: [Module.SINGLE_EXEC],
        args: ["0x"]}

       tx = await   ops["createTask(address,bytes,(uint8[],bytes[]),address)"](host,execData,moduleData,constants.AddressZero)



       await tx.wait()


 
      //  ops = IOps__factory.connect(gelato, executor);
   
   
   
        

   
      //  let id = utils.keccak256(
      //    new utils.AbiCoder().encode(
      //      ['address', 'address', 'bytes4', 'bool', 'address', 'bytes32'],
      //      [floowdyAddress, floowdyAddress, execSelector, false, ETH, resolverHash]
      //    )
      //  );
   
      let stream = await sf.cfaV1.getFlow({
        superToken,
        sender: deployer.address,
        receiver: user1.address,
        providerOrSigner: deployer,
      });

      // console.log(stream.flowRate)


      //  await   ops.connect(executor).exec(deployer.address,host,execData,moduleData,fee,ETH,false,true)

      //  stream = await sf.cfaV1.getFlow({
      //   superToken,
      //   sender: deployer.address,
      //   receiver: user1.address,
      //   providerOrSigner: deployer,
      // });

      console.log(stream.flowRate)
  
    //console.log(tx)

} catch (error) {
  
  console.error(error);
}

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
stopStream().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
