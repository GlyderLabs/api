import * as crypto from "crypto";
import * as dotenv from "dotenv"
import axios, { AxiosResponse } from 'axios'
import mempoolJS from '@mempool/mempool.js';
import pinataSDK from '@pinata/sdk'
import moment from 'moment'
//import { AddressTxsUtxo } from '@mempool/mempool.js/lib/interfaces/bitcoin/addresses';
import CloudinaryManager from "./cloudinary";
import fs from "fs"
import path from "path"
dotenv.config()

const pinata = new pinataSDK({ pinataApiKey: process.env.PINATA_API_KEY, pinataSecretApiKey: process.env.PINATA_API_SECRET });

/**
 * Generate a valid JWT Secret
 * @returns A randomly generated secret key for signing JWTs
 */
export const generateJWTSecret = (): string => {
  return crypto.randomBytes(64).toString("hex"); // Generates a 512-bit secret
};

/**
 * Generate an encryption key and IV
 * @returns An object containing a random encryption key and IV
 */
export const generateEncryptionKeyAndIV = (): { key: string; iv: string } => {
  const key = crypto.randomBytes(32).toString("hex"); // 256-bit key
  const iv = crypto.randomBytes(16).toString("hex");  // 128-bit IV

  return { key, iv };
};


// export const getPrivateKey = () => {
//     return  crypto.randomBytes(32).toString('hex');
// }

// Dynamic import for @cloudflare/zkp-ecdsa
// const zkp_ecdsa = async () => {
//     //const module = await import('@cloudflare/zkp-ecdsa');
//    try{ const module = await (eval(`import('@cloudflare/zkp-ecdsa')`)as Promise<typeof import('@cloudflare/zkp-ecdsa')>);
//    //console.log(module)
//     return {
//         keyToInt: module.keyToInt, 
//         generateParamsList: module.generateParamsList, 
//         proveSignatureList: module.proveSignatureList, 
//         verifySignatureList: module.verifySignatureList,
//         SignatureProofList: module.SignatureProofList
//     }
//     }catch(e){
//         console.log(e)
//     }
// };


// const init = async (network:string) => {
//   const {
//     bitcoin: { addresses, fees, transactions },
//   } = mempoolJS({
//     hostname: 'mempool.space',
//     network,
//   });

//   return { addresses, fees, transactions };
// };

// export async function getRecomendedFee (network:string) {
//   try {
//     //const { fees } = await init(network);
//     let data = await axios.get('https://api.blockchain.info/mempool/fees');
//     const res = {
//       fastestFee: data.data.priority,
//       halfHourFee: data.data.regular,
//     }
//     return {status: true, data: res, message: "network fees fetched"}
//   } catch (e:any) {
//     return {status: false, message: e.message, data: null}
//   }
// };

// export async function _getUtxo(address: string, networkName: string)  {
//   try{
//     if(!address) return {status:false, data: null, message: 'address is required'}
//     const url: string = networkName === "mainnet" ? `https://blockstream.info/api/address/${address}/utxo` : `https://blockstream.info/testnet/api/address/${address}/utxo`
//     const response: AxiosResponse = await axios.get(url)
//     if(response.status !== 200) {
//       const {addresses} = await init(networkName)
//       const utxos:AddressTxsUtxo[] = await addresses.getAddressTxsUtxo({address: address})
//       if(utxos.length === 0) return {status: true, message: 'ok', data: []}
//       return {status: true, message: 'ok', data: utxos}
//     }
//     return {status: true, message: "ok" , data: response.data}
//   }catch(e:any){
//     return {status: false, message: e.message, data: null}
//   }
// }

export function checkTimeElapsed (timestamp: Date, duration: number, timeFraction:string) : boolean{
  const currentTime = moment().utc();
  let timeDiff:number = 0;
  
  if(timeFraction === 'minutes') timeDiff = currentTime.diff(timestamp, 'minutes');
  if(timeFraction === 'hours') timeDiff = currentTime.diff(timestamp, 'hours');
  if(timeFraction === 'days') timeDiff = currentTime.diff(timestamp, 'days');
  if(timeFraction === 'weeks') timeDiff = currentTime.diff(timestamp, 'weeks');
  if(!timeFraction) timeDiff = currentTime.diff(timestamp, 'hours');

  if (timeDiff >= duration) {
    return true;
  }
  return false;
};

const initStorage = async () => new CloudinaryManager();

export async function uploadToCdn (filePath:string){
  try{
    const storage = await initStorage();
    const save = await storage.upload(filePath, {resource_type: "raw"})
    return save;
  }catch(e:any){
    console.log(e.message)
  }
}

export async function downloadCdn (urls:any, savePath:string) {
  try {
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    // Use map to get an array of Promises representing each download operation
    let downloadPromises = urls.map(async (x:any) => {
      let mimetype = path.extname(x.url);
      let fileName = x.fileName+ mimetype;
      let response = await axios.get(x.url, { responseType: 'stream' });
      let chunk = fs.createWriteStream(savePath + '/' + fileName);

      return new Promise((resolve, reject) => {
        response.data.pipe(chunk);
        chunk.on("error", (err) => {
          reject(err);
        });

        chunk.on("finish", () => {
          resolve({
            mimetype: mimetype,
            outPath: savePath + '/' + fileName,
            fileName: x.fileName,
          });
        });
      });
    });

    // Wait for all downloadPromises to resolve
    let saved = await Promise.all(downloadPromises);

    return saved;
  } catch (e:any) {
    console.log(e.message);
  }
};

export const authPinata = async () => {
  try{
    const result = await pinata.testAuthentication()
    if(!result){
      throw ("Pinata authentication failed")
    }
    return result
  }catch(e:any){
    console.log(e.message)
  }

}

export const upload_dir_ipfs = async (dirPath:string) => {
  try{
    const auth = await authPinata()
    if(!auth || auth.authenticated === false){
      throw ("Pinata authentication failed")
    }
    const result = await pinata.pinFromFS(dirPath)
    if(result === undefined){
      console.log("Pinata upload failed")
      return
    }
    //delete the directory after upload
    fs.rmdirSync(dirPath, { recursive: true })
    return result
  }catch(e:any){
    console.log(e)
  }
}

