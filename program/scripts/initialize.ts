import * as anchor from "@coral-xyz/anchor";
import { loadKeyPair } from "../helper";
import { Connection } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  findTreeConfigPda,
  mplBubblegum,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import "dotenv/config";

import * as skyTradeLandTokenProgramClient from "../client/sky_trade_land_token_program";

(async () => {
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

  const merkleTreeAddr = landMerkleTree.publicKey;

  const dataAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("data_account")],
    skyTradeLandTokenProgramClient.PROGRAM_PUBKEY
  )[0];

  await skyTradeLandTokenProgramClient.InitializeSendAndConfirm(
    dataAccount,
    merkleTreeAddr,
    centralizedAccount
  );
})();
