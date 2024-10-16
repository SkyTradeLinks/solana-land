import {
  fetchTreeConfig,
  findLeafAssetIdPda,
  getMetadataArgsSerializer,
  MetadataArgsArgs,
  MPL_BUBBLEGUM_PROGRAM_ID,
  parseLeafFromMintToCollectionV1Transaction,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@metaplex-foundation/mpl-bubblegum";
import { InitialSetupData } from "../utils/initialSetup";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
import { assert } from "chai";
import { decode } from "@coral-xyz/anchor/dist/cjs/utils/bytes/bs58";
import { publicKey } from "@metaplex-foundation/umi";
import BN from "bn.js";

export const mintTokenUnverified = async (
  initialSetupData: InitialSetupData,
  metadataArgs: MetadataArgsArgs,
  propertyOwnerUserWallet: PublicKey
) => {
  const {
    program,
    wallet,
    connection,
    collection,
    dataAccount,
    merkleTree,
    umi,
    umiDas,
    mintCreator,
    treeConfig,
    bubblegumSigner,
    collectionMetadata,
    collectionEdition,
  } = initialSetupData;

  const metadataArgsBytes = getMetadataArgsSerializer().serialize(metadataArgs);

  const treeConfigData = await fetchTreeConfig(umi, publicKey(treeConfig));

  const [assetIdMpl] = findLeafAssetIdPda(umi, {
    merkleTree: publicKey(merkleTree),
    leafIndex: treeConfigData.numMinted,
  });
  const assetId = new PublicKey(assetIdMpl);

  const [unverifiedTokenHolder] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("unverified_token_holder", "utf8"),
      propertyOwnerUserWallet.toBytes(),
      assetId.toBytes(),
    ],
    program.programId
  );

  const txSig = await program.methods
    .mintTokenUnverified(Buffer.from(metadataArgsBytes))
    .accountsStrict({
      dataAccountAuthority: wallet.publicKey,
      dataAccount,
      merkleTree,
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
      propertyOwnerUserWallet,
      unverifiedTokenHolder,
      assetId,
      collectionAuthority: wallet.publicKey,
      treeCreator: wallet.publicKey,
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

  assert(leaf.owner == unverifiedTokenHolder.toString());

  return { assetId: new PublicKey(leaf.id) };
};
