import * as anchor from '@coral-xyz/anchor';
import { loadKeyPair } from '../helper';
import { Connection } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createTree,
  findTreeConfigPda,
  mplBubblegum,
} from '@metaplex-foundation/mpl-bubblegum';
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from '@metaplex-foundation/umi';
import 'dotenv/config';

import * as skyTradeLandTokenProgramClient from '../client/sky_trade_land_token_program';
import { ValidDepthSizePair } from '@solana/spl-account-compression';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';

(async () => {
  // input private key here

  let centralizedAccount = loadKeyPair(process.env.ANCHOR_WALLET as string);

  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  // setup umi
  const umi = createUmi(provider.connection.rpcEndpoint)
    .use(mplTokenMetadata())
    .use(mplBubblegum())
    .use(dasApi());

  let authoritySigner = createSignerFromKeypair(umi, {
    secretKey: centralizedAccount.secretKey,
    publicKey: publicKey(centralizedAccount.publicKey),
  });

  umi.use(signerIdentity(authoritySigner));

  // land merkle tree address
  const landMerkleTree = loadKeyPair(process.env.LAND_MERKLE_TREE);
  let merkleSigner = createSignerFromKeypair(umi, {
    secretKey: landMerkleTree.secretKey,
    publicKey: publicKey(landMerkleTree.publicKey),
  });
  const maxDepthSizePair: ValidDepthSizePair = {
    maxDepth: 14,
    maxBufferSize: 64,
  };
  const canopyDepth = maxDepthSizePair.maxDepth - 5;
  const treeTx = await createTree(umi, {
    merkleTree: merkleSigner,
    ...maxDepthSizePair,
    canopyDepth,
  });
  const { blockhash, lastValidBlockHeight } =
    await umi.rpc.getLatestBlockhash();
  await treeTx.sendAndConfirm(umi, {
    send: { commitment: 'finalized' },
    confirm: {
      strategy: { type: 'blockhash', blockhash, lastValidBlockHeight },
    },
  });
  const merkleTreeAddr = landMerkleTree.publicKey;

  const dataAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('data_account')],
    skyTradeLandTokenProgramClient.PROGRAM_PUBKEY
  )[0];

  await skyTradeLandTokenProgramClient.InitializeSendAndConfirm(
    dataAccount,
    merkleTreeAddr,
    centralizedAccount
  );
})();
