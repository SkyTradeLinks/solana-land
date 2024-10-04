import { assert } from "chai";
import { InitialSetupData } from "../utils/initialSetup";
import {
  getMetadataArgsSerializer,
  MPL_BUBBLEGUM_PROGRAM_ID,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  TokenProgramVersion,
  TokenStandard,
} from "@metaplex-foundation/mpl-bubblegum";
import { publicKey } from "@metaplex-foundation/umi";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { AnchorError } from "@coral-xyz/anchor";
import { mintToken } from "../ix_helpers/mintToken";

/** Should fail to mint if we send less than the 3 required creators */
export const mintTokenWithOneCreatorTest = async (
  initialSetupData: InitialSetupData
) => {
  const { wallet, collection, mintCreator, verificationCreator } =
    initialSetupData;

  const recipient = Keypair.generate();

  const metadataArgs = {
    name: "Land NFT",
    symbol: "",
    uri: "",
    creators: [
      { address: publicKey(wallet.publicKey), verified: false, share: 100 },
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

  await mintToken(initialSetupData, metadataArgs, recipient.publicKey).catch(
    (e) => {
      assert(e instanceof AnchorError);
      const errorCode = e.error.errorCode.code;
      assert(errorCode == "InvalidCreatorsAmount");
    }
  );
};
