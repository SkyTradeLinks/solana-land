import { createNft } from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  KeypairSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import { Umi } from "@metaplex-foundation/umi/dist/types/Umi";
import { Keypair, PublicKey } from "@solana/web3.js";

export const createCollection = async (
  umi: Umi,
  collectionAuthority?: KeypairSigner
) => {
  const collectionMint = generateSigner(umi);

  // If don't receive a `collectionAuthority` generate one
  const collectionAuthoritySigner = collectionAuthority
    ? collectionAuthority
    : generateSigner(umi);

  await createNft(umi, {
    mint: collectionMint,
    authority: collectionAuthoritySigner,
    name: "My Collection",
    uri: "https://example.com/my-collection.json",
    sellerFeeBasisPoints: percentAmount(5.5), // 5.5%
    isCollection: true,
  }).sendAndConfirm(umi);

  return {
    key: new PublicKey(collectionMint.publicKey),
    authority: Keypair.fromSecretKey(collectionAuthoritySigner.secretKey),
  };
};
