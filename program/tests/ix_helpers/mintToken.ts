import {
  getMetadataArgsSerializer,
  MetadataArgsArgs,
  MPL_BUBBLEGUM_PROGRAM_ID,
  parseLeafFromMintToCollectionV1Transaction,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@metaplex-foundation/mpl-bubblegum";
import { InitialSetupData } from "../utils/initialSetup";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { decode } from "@coral-xyz/anchor/dist/cjs/utils/bytes/bs58";

export const mintToken = async (
  initialSetupData: InitialSetupData,
  metadataArgs: MetadataArgsArgs,
  recipient: PublicKey
) => {
  const {
    program,
    wallet,
    connection,
    collection,
    dataAccount,
    merkleTree,
    umi,
    mintCreator,
    verificationCreator,
    treeConfig,
    bubblegumSigner,
    collectionMetadata,
    collectionEdition,
  } = initialSetupData;

  const metadataArgsBytes = getMetadataArgsSerializer().serialize(metadataArgs);

  const txSig = await program.methods
    .mintToken(Buffer.from(metadataArgsBytes))
    .accountsStrict({
      feePayer: wallet.publicKey,
      dataAccount,
      merkleTree,
      recipient,
      treeConfig,
      bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      collectionMint: collection.key,
      collectionMetadata,
      collectionEdition,
      bubblegumSigner,
      tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      mintCreator,
      verificationCreator,
    })
    // We only need to sign with wallet (current `Data.authority_account`) because the collection auth
    //  and the tree creator are set to this same pubkey
    .signers([wallet])
    .rpc();

  console.log("tx sig: ", txSig);
  await connection.confirmTransaction(txSig);

  const leaf = await parseLeafFromMintToCollectionV1Transaction(
    umi,
    decode(txSig)
  );

  assert(leaf.owner == recipient.toString());

  return { assetId: new PublicKey(leaf.id) };
};
