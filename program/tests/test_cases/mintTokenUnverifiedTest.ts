import { InitialSetupData } from "../utils/initialSetup";
import {
  TokenProgramVersion,
  TokenStandard,
} from "@metaplex-foundation/mpl-bubblegum";
import { publicKey } from "@metaplex-foundation/umi";

import { mintTokenUnverified } from "../ix_helpers/mintTokenUnverified";

export const mintTokenUnverifiedTest = async (
  initialSetupData: InitialSetupData
) => {
  const { wallet, collection, mintCreator } = initialSetupData;

  const metadataArgs = {
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

  const { assetId } = await mintTokenUnverified(initialSetupData, metadataArgs);

  console.log("assetId: ", assetId.toBase58());
};
