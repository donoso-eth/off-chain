const { fstat, writeFileSync } = require('fs');
const path = require('path');
const fs = require('fs-extra')

async function deployIpfs() {
    const { spawn } = await import("child_process");
  
    const childProcess = spawn('npx.cmd', ['polywrap', 'deploy' ], {

      stdout:"inherit"
    });
  
    return new Promise((resolve, reject) => {
      let bufferData = '';

      childProcess.stdout.on('data', (data)=> {
        bufferData = bufferData.concat(data);

      }) 
      childProcess.once("close", (status) => {
        childProcess.removeAllListeners("error");
  
        let output = bufferData.toString();

        let i = output.indexOf( 'wrap://ipfs/')
       
        const ipfsHash = output.substring(i + 'wrap://ipfs/'.length,i + 'wrap://ipfs/'.length + 46);

        fs. writeFileSync(path.join(process.cwd(),"../hardhat/data/ipfsHash.ts"),`export const  ipfsHash = "${ipfsHash}";`)



        if (status === 0) {
          resolve(true);
          return;
        }
        
        reject(false);
      });
  
      childProcess.once("error", (_status) => {
        childProcess.removeAllListeners("close");
        console.log(_status)
        reject(false);
      });
    });
  }

  deployIpfs().then(()=> {}).catch((error)=> console.log(error))