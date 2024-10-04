import { generateSigner, Signer } from "@metaplex-foundation/umi";
import {
  createTree,
  fetchMerkleTree,
} from "@metaplex-foundation/mpl-bubblegum";
import { PublicKey } from "@solana/web3.js";
import { Umi } from "@metaplex-foundation/umi/dist/types/Umi";

export const createMplTree = async (umi: Umi, creator?: Signer) => {
  const merkleTree = generateSigner(umi);

  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
    treeCreator: creator, // If we don't set the tree creator it defaults to the `Umi` wallet
    // public: false // By default this is `false`
    canopyDepth: 3,
  });

  await builder.sendAndConfirm(umi);

  // console.log("merkleTree: ", merkleTree.publicKey.toString())
  // const merkleTreeAccount = await fetchMerkleTree(umi, merkleTree.publicKey)
  // console.log(merkleTreeAccount)

  return { merkleTree: new PublicKey(merkleTree.publicKey) };
};
