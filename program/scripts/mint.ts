import * as anchor from "@coral-xyz/anchor";
import { findLeafIndexFromUmiTx, loadKeyPair, sleep } from "../helper";
import { Connection, PublicKey } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  findTreeConfigPda,
  getMetadataArgsSerializer,
  mplBubblegum,
  TokenProgramVersion,
  TokenStandard,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import "dotenv/config";

import * as skyTradeLandTokenProgramClient from "../client/sky_trade_land_token_program";
import { decode } from "@coral-xyz/anchor/dist/cjs/utils/bytes/bs58";
import { join } from "path";

async function mint(){
  // input private key here
  let centralizedAccount = loadKeyPair(process.env.ANCHOR_WALLET);

  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  // setup umi
  const umi = createUmi(provider.connection.rpcEndpoint).use(mplBubblegum());

  let authoritySigner = createSignerFromKeypair(umi, {
    secretKey: centralizedAccount.secretKey,
    publicKey: publicKey(centralizedAccount.publicKey),
  });

  umi.use(signerIdentity(authoritySigner));

  // land merkle tree address
  const landMerkleTree = loadKeyPair(process.env.LAND_MERKLE_TREE);

 const collectionMint = new PublicKey(
   "8d3J88WsuaBt3nXBG2Bspo7eJ3SEbnaP5y5Cwv2FFi5x"
 );

    const metadata_args = getMetadataArgsSerializer().serialize({
      name: "Land NFT",
      symbol: "",
      uri: "",
      creators: [
        { address: umi.identity.publicKey, verified: true, share: 100 },
      ],
      sellerFeeBasisPoints: 0,
      primarySaleHappened: false,
      isMutable: true,
      editionNonce: null,
      uses: null,
      collection: { key: publicKey(collectionMint), verified: true },
      tokenProgramVersion: TokenProgramVersion.Original,
      tokenStandard: TokenStandard.NonFungible,
    });

    const merkleTreeAddr = new anchor.web3.PublicKey(
      "C6VjJrWe1Eow3wzzcMhcRDQfMb3pwwCPNAL9seXrupyE"
    );

  let feePayer = loadKeyPair(process.env.ANCHOR_WALLET);

    const dataAccount = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("data_account")],
      skyTradeLandTokenProgramClient.PROGRAM_PUBKEY
    )[0];
  
  const recipient = feePayer.publicKey;

    const treeConfig = findTreeConfigPda(umi, {
      merkleTree: publicKey(merkleTreeAddr),
    })[0];
  
    const mintSx = await skyTradeLandTokenProgramClient.MintTokenSendAndConfirm(
      umi,
      Buffer.from(metadata_args),
      dataAccount,
      merkleTreeAddr,
      recipient,
      new anchor.web3.PublicKey(treeConfig),
      collectionMint,
      feePayer
    );

    let mintTxInfo;

    let i = 1;

    while (i < 6) {
      const tx0 = await umi.rpc.getTransaction(decode(mintSx), {
        commitment: "confirmed",
      });

      if (tx0 !== null) {
        mintTxInfo = tx0;
        break;
      }

      await sleep(1000 * i);

      i++;
    }
  
  console.log("minted", mintSx);

    let leafIndex = findLeafIndexFromUmiTx(mintTxInfo);

    console.log(leafIndex);
  };

  mint()