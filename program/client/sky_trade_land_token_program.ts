import { AnchorProvider, Program } from "@coral-xyz/anchor";
import IDL from "../target/idl/sky_trade_land_token_program.json";
import { SkyTradeLandTokenProgram } from "../target/types/sky_trade_land_token_program";
const provider = AnchorProvider.env();
import {
  MPL_BUBBLEGUM_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
} from "@metaplex-foundation/mpl-bubblegum";
import { getPriorityFeeIx } from "../helper";
import { Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import {
  findMetadataPda,
  findMasterEditionPda,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { Umi, publicKey, generateSigner, signerPayer, signerIdentity, createSignerFromKeypair } from "@metaplex-foundation/umi";

// update to match program pubkey in lib.rs
export const PROGRAM_PUBKEY = new PublicKey(
  "Ahpi2nJwgMXU4hpiRYrz1JMC8fvPKD55ZBcWaFdNxTo7"
);

const getProgram = (anchorProvider: AnchorProvider = provider) => {
  return new Program<SkyTradeLandTokenProgram>(
    IDL as any,
    PROGRAM_PUBKEY,
    provider
  );
};

const toPubkey = (
  publicKeyOrKeypair: PublicKey | Keypair
): PublicKey => {
  return publicKeyOrKeypair instanceof Keypair
    ? publicKeyOrKeypair.publicKey
    : publicKeyOrKeypair;
};

export const program = getProgram();

export const deriveData = (): PublicKey => {
  const [pubkey, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("data_account")],
    PROGRAM_PUBKEY
  );
  return pubkey;
};

export const fetchData = (address: PublicKey) => {
  return program.account.data.fetch(address);
};

export async function InitializeSendAndConfirm(
  data_account: PublicKey,
  merkle_tree: PublicKey,
  fee_payer: Keypair
) {
  const initializeAccountInputs = {
    dataAccount: data_account,
    merkleTree: merkle_tree,
    systemProgram: SystemProgram.programId,
    feePayer: toPubkey(fee_payer),
  };

  let priorityIx = await getPriorityFeeIx(provider.connection);

  let ix = await program.methods
    .initialize()
    .accounts(initializeAccountInputs)
    .instruction();

  let tx = new Transaction();

  tx.add(priorityIx);
  tx.add(ix);

  tx.recentBlockhash = await (
    await provider.connection.getLatestBlockhash()
  ).blockhash;

  tx.feePayer = initializeAccountInputs.feePayer;
  tx.sign(fee_payer);

  try {
    let sx = await provider.connection.sendRawTransaction(tx.serialize());
  } catch (err) {
    console.log(err);
  }
}

export function Initialize(
  data_account: PublicKey,
  merkle_tree: PublicKey,

  fee_payer: PublicKey | Keypair
) {
  const initializeAccountInputs = {
    dataAccount: data_account,
    merkleTree: merkle_tree,
    systemProgram: SystemProgram.programId,
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
  data_account: PublicKey,
  merkle_tree: PublicKey,
  recipient: PublicKey,
  tree_config: PublicKey,
  collectionMint: PublicKey,
  fee_payer: PublicKey | Keypair
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
    [Buffer.from("collection_cpi", "utf8")],
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
    systemProgram: SystemProgram.programId,
    collectionMint,
    collectionMetadata,
    collectionEdition,
    bubblegumSigner,
    tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
  };

  const mintTokensignerKeypairs = mintTokenSigners.filter(
    (signer): signer is Keypair =>
      signer instanceof Keypair
  );

  const mintTokenBuilder = program.methods
    .mintToken(metadata_args)
    .accounts(mintTokenAccountInputs);
  if (mintTokensignerKeypairs.length > 0) {
    mintTokenBuilder.signers(mintTokensignerKeypairs);
  }
  return mintTokenBuilder.rpc();
}

export async function MintTokenV0(
  umi: Umi,
  metadata_args: Buffer,
  data_account: PublicKey,
  merkle_tree: PublicKey,
  recipient: PublicKey,
  tree_config: PublicKey,
  collectionMint: PublicKey,
  fee_payer: PublicKey | Keypair
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
    [Buffer.from("collection_cpi", "utf8")],
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
    systemProgram: SystemProgram.programId,
    collectionMint,
    collectionMetadata,
    collectionEdition,
    bubblegumSigner,
    tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
  };

  const mintTokensignerKeypairs = mintTokenSigners.filter(
    (signer): signer is Keypair =>
      signer instanceof Keypair
  );

  const mintTokenBuilder = program.methods
    .mintToken(metadata_args)
    .accounts(mintTokenAccountInputs);
  if (mintTokensignerKeypairs.length > 0) {
    mintTokenBuilder.signers(mintTokensignerKeypairs);
  }

  const mintInstr = await mintTokenBuilder.instruction()

  const lookupTableAddress = new PublicKey(
    "FYSE85eSxY2NzxTusnuN9K1b5JGRZKUPNmSnBFCQ2ALw"
  );
const lookupTableAccount = (
  await provider.connection.getAddressLookupTable(lookupTableAddress)
).value;

  const recentBlockhash = await(
    await provider.connection.getLatestBlockhash()
  ).blockhash;

  const messageV0 = new TransactionMessage({
    payerKey: toPubkey(fee_payer),
    recentBlockhash: recentBlockhash,
    instructions: [mintInstr], // note this is an array of instructions
  }).compileToV0Message([lookupTableAccount]);

  // create a v0 transaction from the v0 message
  const transactionV0 = new VersionedTransaction(messageV0);

  // sign the v0 transaction using the file system wallet we created named `payer`
  transactionV0.sign([fee_payer as Keypair]);
 
  return provider.connection.sendTransaction(transactionV0)
}


export function MintToken(
  metadata_args: Buffer,
  data_account: PublicKey,
  merkle_tree: PublicKey,
  recipient: PublicKey,
  tree_config: PublicKey,
  fee_payer: PublicKey | Keypair
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
    systemProgram: SystemProgram.programId,
  };

  return program.methods
    .mintToken(metadata_args)
    .accounts(mintTokenAccountInputs)
    .instruction();
}
