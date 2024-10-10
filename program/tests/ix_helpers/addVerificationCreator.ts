import {
  MetadataArgsArgs,
  MPL_BUBBLEGUM_PROGRAM_ID,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@metaplex-foundation/mpl-bubblegum";
import { InitialSetupData, sleep } from "../utils/initialSetup";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  SystemProgram,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  AddressLookupTableProgram,
} from "@solana/web3.js";
import { readFromMPL } from "../utils/mpl/readFromMPL";
import { sendTxWithLUT } from "../utils/sendTxWithLUT";

export const addVerificationCreator = async (
  initialSetupData: InitialSetupData,
  recipient: PublicKey,
  assetId: PublicKey
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
    verificationCreator,
    treeConfig,
    collectionMetadata,
  } = initialSetupData;

  const { proof, metadata, decompressedMetadata } = await readFromMPL(
    assetId,
    umi,
    umiDas,
    connection
  );

  // Create AddressLookupTable
  const [lookupTableIx, lookupTable] =
    AddressLookupTableProgram.createLookupTable({
      authority: wallet.publicKey,
      payer: wallet.publicKey,
      recentSlot: await connection.getSlot({ commitment: "finalized" }),
    });

  const lookupTableAddresses = [
    new PublicKey(MPL_BUBBLEGUM_PROGRAM_ID),
    new PublicKey(SPL_NOOP_PROGRAM_ID),
    new PublicKey(SPL_ACCOUNT_COMPRESSION_PROGRAM_ID),
    ...proof.map((key) => key.pubkey),
  ];

  const extendIx = AddressLookupTableProgram.extendLookupTable({
    payer: wallet.publicKey,
    authority: wallet.publicKey,
    lookupTable,
    addresses: lookupTableAddresses,
  });
  const tx = new Transaction().add(lookupTableIx, extendIx);
  await sendAndConfirmTransaction(connection, tx, [wallet]);

  await sleep(1000);

  // Set the metadata to update (we only want to update the creators field)
  const updateArgs = {
    name: null,
    symbol: null,
    uri: null,
    creators: [
      { address: wallet.publicKey, verified: false, share: 100 },
      { address: mintCreator, verified: true, share: 0 },
      { address: verificationCreator, verified: false, share: 0 },
    ],
    sellerFeeBasisPoints: null,
    primarySaleHappened: null,
    isMutable: null,
  };

  const [unverifiedTokenHolder] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("unverified_token_holder", "utf8"),
      recipient.toBytes(),
      assetId.toBytes(),
    ],
    program.programId
  );

  const ix = await program.methods
    .addVerificationCreator({
      root: metadata.root,
      nonce: metadata.nonce,
      index: metadata.index,
      currentMetadata: decompressedMetadata,
      updateArgs: updateArgs,
    })
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
      tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      mintCreator,
      verificationCreator,
      assetId,
      unverifiedTokenHolder,
    })
    // We only need to sign with wallet (current `Data.authority_account`) because the collection auth
    //  and the tree creator are set to this same pubkey
    .signers([wallet])
    .remainingAccounts(proof)
    .instruction();
  // .rpc()
  // .catch((e) => console.log(e));

  await sendTxWithLUT(program.provider, wallet, ix, lookupTable);
};
