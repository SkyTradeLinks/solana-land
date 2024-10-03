import { InitialSetupData } from "../utils/initialSetup";
import {
  TokenProgramVersion,
  TokenStandard,
} from "@metaplex-foundation/mpl-bubblegum";
import { publicKey } from "@metaplex-foundation/umi";
import { Keypair } from "@solana/web3.js";
import { mintToken } from "../ix_helpers/mintToken";

export const mintTokenTest = async (initialSetupData: InitialSetupData) => {
  const { wallet, collection, mintCreator, verificationCreator } =
    initialSetupData;

  const recipient = Keypair.generate();

  const metadataArgs = {
    name: "Land NFT",
    symbol: "",
    uri: "",
    creators: [
      { address: publicKey(wallet.publicKey), verified: false, share: 100 },
      { address: publicKey(mintCreator), verified: true, share: 0 },
      { address: publicKey(verificationCreator), verified: true, share: 0 },
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

  const { assetId } = await mintToken(
    initialSetupData,
    metadataArgs,
    recipient.publicKey
  );

  console.log("assetId: ", assetId.toBase58());
};
