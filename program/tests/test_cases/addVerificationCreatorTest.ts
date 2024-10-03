import { InitialSetupData } from "../utils/initialSetup";
import {
  TokenProgramVersion,
  TokenStandard,
} from "@metaplex-foundation/mpl-bubblegum";
import { publicKey } from "@metaplex-foundation/umi";

import { mintTokenUnverified } from "../ix_helpers/mintTokenUnverified";
import { addVerificationCreator } from "../ix_helpers/addVerificationCreator";
import { Keypair } from "@solana/web3.js";
import { readAssetIdWithRetries } from "../utils/mpl/readFromMPL";
import { assert } from "chai";

export const addVerificationCreatorTest = async (
  initialSetupData: InitialSetupData
) => {
  const { wallet, collection, mintCreator, umiDas, verificationCreator } =
    initialSetupData;

  const recipient = Keypair.generate();

  const initialMetadata = {
    name: "Land NFT",
    symbol: "",
    uri: "",
    creators: [
      { address: publicKey(wallet.publicKey), verified: false, share: 100 },
      { address: publicKey(mintCreator), verified: true, share: 0 },
    ],
    sellerFeeBasisPoints: 0,
    primarySaleHappened: false,
    isMutable: true,
    editionNonce: null,
    uses: null,
    collection: { key: publicKey(collection.key), verified: true },
    tokenProgramVersion: TokenProgramVersion.Original,
    tokenStandard: TokenStandard.NonFungible,
  };

  // Mint the unverified token
  const { assetId } = await mintTokenUnverified(
    initialSetupData,
    initialMetadata
  );

  // Verify the token and transfer it to the user
  await addVerificationCreator(initialSetupData, recipient.publicKey, assetId);

  const assetIdData = await readAssetIdWithRetries(umiDas, assetId, {
    initialWait: 500,
  });
  assert(assetIdData.leafOwner == publicKey(recipient.publicKey));
  assert(assetIdData.metadata.creators.length == 3);
  assert(
    assetIdData.metadata.creators[2].address == publicKey(verificationCreator)
  );
  assert(assetIdData.metadata.creators[2].verified);
};
