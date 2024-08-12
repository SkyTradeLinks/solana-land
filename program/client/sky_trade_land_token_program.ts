import * as anchor from '@coral-xyz/anchor';

import { Program } from '@coral-xyz/anchor';
import IDL from '../target/idl/sky_trade_land_token_program.json';
import { SkyTradeLandTokenProgram } from '../target/types/sky_trade_land_token_program';
const provider = anchor.AnchorProvider.env();

// update to match program pubkey in lib.rs
export const PROGRAM_PUBKEY = new anchor.web3.PublicKey(
  "57Ubxrgvg5ju9Dhk6UUm76jVyrACJqwtxLPhkEaVHzrQ"
);

import {
  MPL_BUBBLEGUM_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
} from '@metaplex-foundation/mpl-bubblegum';
import { getPriorityFeeIx } from '../helper';
import { PublicKey } from '@solana/web3.js';
import {
  findMetadataPda,
  findMasterEditionPda,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import { Umi, publicKey } from '@metaplex-foundation/umi';

const getProgram = (anchorProvider: anchor.AnchorProvider = provider) => {
  return new anchor.Program<SkyTradeLandTokenProgram>(IDL as any, provider);
};

const toPubkey = (
  publicKeyOrKeypair: anchor.web3.PublicKey | anchor.web3.Keypair
): anchor.web3.PublicKey => {
  return publicKeyOrKeypair instanceof anchor.web3.Keypair
    ? publicKeyOrKeypair.publicKey
    : publicKeyOrKeypair;
};

export const program = getProgram();

export const deriveData = (): anchor.web3.PublicKey => {
  const [pubkey, bump] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('data_account')],
    PROGRAM_PUBKEY
  );
  return pubkey;
};

export const fetchData = (address: anchor.web3.PublicKey) => {
  return program.account.data.fetch(address);
};

export async function InitializeSendAndConfirm(
  data_account: anchor.web3.PublicKey,
  merkle_tree: anchor.web3.PublicKey,
  fee_payer: anchor.web3.Keypair
) {
  const initializeAccountInputs = {
    dataAccount: data_account,
    merkleTree: merkle_tree,
    systemProgram: anchor.web3.SystemProgram.programId,
    feePayer: toPubkey(fee_payer),
  };

  let priorityIx = await getPriorityFeeIx(provider.connection);

  let ix = await program.methods
    .initialize()
    .accounts(initializeAccountInputs)
    .instruction();

  let tx = new anchor.web3.Transaction();

  tx.add(priorityIx);
  tx.add(ix);

  tx.recentBlockhash = await (
    await provider.connection.getLatestBlockhash()
  ).blockhash;

  tx.feePayer = initializeAccountInputs.feePayer;
  tx.sign(fee_payer);

  try {
    let sx = await provider.connection.sendRawTransaction(tx.serialize());
    console.log("sx", sx)
  } catch (err) {
    console.log(err);
  }
}

export function Initialize(
  data_account: anchor.web3.PublicKey,
  merkle_tree: anchor.web3.PublicKey,

  fee_payer: anchor.web3.PublicKey | anchor.web3.Keypair
) {
  const initializeAccountInputs = {
    dataAccount: data_account,
    merkleTree: merkle_tree,
    systemProgram: anchor.web3.SystemProgram.programId,
    feePayer: toPubkey(fee_payer),
  };

  return program.methods
    .initialize()
    .accounts(initializeAccountInputs)
    .instruction();
}

export async function MintTokenSendAndConfirm(
  umi: Umi,

  metadata_args: Buffer,
  data_account: anchor.web3.PublicKey,
  merkle_tree: anchor.web3.PublicKey,
  recipient: anchor.web3.PublicKey,
  tree_config: anchor.web3.PublicKey,
  collectionMint: anchor.web3.PublicKey,
  fee_payer: anchor.web3.PublicKey | anchor.web3.Keypair
) {
  const mintTokenSigners = [fee_payer];

  let [collectionMetadata] = findMetadataPda(umi, {
    mint: publicKey(collectionMint),
  });

  let [collectionEdition] = findMasterEditionPda(umi, {
    mint: publicKey(collectionMint),
  });

  const [bubblegumSigner] = PublicKey.findProgramAddressSync(
    // `collection_cpi` is a custom prefix required by the Bubblegum program
    [Buffer.from('collection_cpi', 'utf8')],
    new PublicKey(MPL_BUBBLEGUM_PROGRAM_ID)
  );

  const mintTokenAccountInputs = {
    dataAccount: data_account,
    merkleTree: merkle_tree,
    recipient: recipient,
    treeConfig: tree_config,
    bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
    logWrapper: SPL_NOOP_PROGRAM_ID,
    compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    feePayer: toPubkey(fee_payer),
    systemProgram: anchor.web3.SystemProgram.programId,
    collectionMint,
    collectionMetadata,
    collectionEdition,
    bubblegumSigner,
    tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
  };

  const mintTokensignerKeypairs = mintTokenSigners.filter(
    (signer): signer is anchor.web3.Keypair =>
      signer instanceof anchor.web3.Keypair
  );

  const mintTokenBuilder = program.methods
    .mintToken(metadata_args)
    .accounts(mintTokenAccountInputs);
  if (mintTokensignerKeypairs.length > 0) {
    mintTokenBuilder.signers(mintTokensignerKeypairs);
  }
  return mintTokenBuilder.rpc();
}

export function MintToken(
  metadata_args: Buffer,
  data_account: anchor.web3.PublicKey,
  merkle_tree: anchor.web3.PublicKey,
  recipient: anchor.web3.PublicKey,
  tree_config: anchor.web3.PublicKey,
  fee_payer: anchor.web3.PublicKey | anchor.web3.Keypair
) {
  const mintTokenAccountInputs = {
    dataAccount: data_account,
    merkleTree: merkle_tree,
    recipient: recipient,
    treeConfig: tree_config,
    bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
    logWrapper: SPL_NOOP_PROGRAM_ID,
    compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    feePayer: toPubkey(fee_payer),
    systemProgram: anchor.web3.SystemProgram.programId,
  };

  return program.methods
    .mintToken(metadata_args)
    .accounts(mintTokenAccountInputs)
    .instruction();
}
