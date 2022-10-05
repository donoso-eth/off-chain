import { BigInt, JSON } from "@polywrap/wasm-as";
import {
  Ethereum_Module,
  Graph_Module,
  Logger_Logger_LogLevel,
  Logger_Module,
  Http_Module,
} from "./wrap";
import { Args_checker, CheckerResult } from "./wrap";
import { GelatoArgs } from "./wrap/GelatoArgs";
import { UserArgs } from "./wrap/UserArgs";
import { execData} from './contract/execData' 

export function checker(args: Args_checker): CheckerResult {
  let userArgs = UserArgs.fromBuffer(args.userArgsBuffer);
  let gelatoArgs = GelatoArgs.fromBuffer(args.gelatoArgsBuffer);

  let gasPrice = gelatoArgs.gasPrice;
  let timeStamp = gelatoArgs.timeStamp;

  let guess = userArgs.guess;

  let mod = BigInt.from(guess).mod(BigInt.from(2));

  let canExec = mod == BigInt.from(0) ? true : false;

  let payload = execData;

  if (canExec == false){
    payload = "";
  }


  return { canExec, execData:payload };
}
