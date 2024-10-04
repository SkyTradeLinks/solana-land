import {
  fetchTreeConfigFromSeeds,
  getAssetWithProof,
} from "@metaplex-foundation/mpl-bubblegum";
import { isSome, publicKey, Umi } from "@metaplex-foundation/umi";
import { PublicKey, Connection } from "@solana/web3.js";
import BN from "bn.js";
import { ConcurrentMerkleTreeAccount } from "@solana/spl-account-compression";
import "dotenv/config";

export const sleep = (delay) =>
  new Promise((resolve) => setTimeout(resolve, delay));

/** Just a wrapper around `getAssetWithProof` which handles retrying reading */
export const readAssetIdWithRetries = async (
  umi: Umi,
  assetId: PublicKey,
  options?: {
    maxSecs?: number;
    initialWait?: number;
  }
) => {
  const maxSecs = options && options.maxSecs ? options.maxSecs : 10;
  const initialWaitingMs =
    options && options.initialWait ? options.initialWait : 100;
  await sleep(initialWaitingMs);

  for (let i = 1; i <= 10 * maxSecs; i++) {
    try {
      const assetWithProof = await getAssetWithProof(umi, publicKey(assetId));
      return assetWithProof;
    } catch (e) {
      if (i > 5 && i % 5 == 0) {
        console.warn("error reading assetId, retrying..");
      }
    }
    await sleep(100);
  }

  throw new Error("error reading assetId");
};

export const getCanopyDepth = async (
  connection: Connection,
  merkleTree: PublicKey
) => {
  const splCMT = await ConcurrentMerkleTreeAccount.fromAccountAddress(
    connection,
    merkleTree
  );
  return splCMT.getCanopyDepth();
};

export const readFromMPL = async (
  assetId: PublicKey,
  umi: Umi,
  umiDas: Umi,
  connection: Connection
) => {
  const assetWithProof = await readAssetIdWithRetries(umiDas, assetId);

  const merkleTree = new PublicKey(assetWithProof.merkleTree);
  const treeConfig = await fetchTreeConfigFromSeeds(umi, {
    merkleTree: assetWithProof.merkleTree,
  });

  const canopyDepth = await getCanopyDepth(connection, merkleTree);
  const proofLen = assetWithProof.proof.length;

  const proof = assetWithProof.proof
    .map((node) => ({
      pubkey: new PublicKey(node),
      isSigner: false,
      isWritable: false,
    }))
    .slice(0, proofLen - canopyDepth);

  const mplCollection = assetWithProof.metadata.collection;
  let collection = null;
  if (isSome(mplCollection)) {
    collection = {
      key: new PublicKey(mplCollection.value.key),
      verified: mplCollection.value.verified,
    };
  }

  return {
    merkleTree,
    treeConfig: treeConfig.publicKey,
    assetWithProof,
    metadata: {
      root: Array.from(assetWithProof.root),
      dataHash: Array.from(assetWithProof.dataHash),
      creatorHash: Array.from(assetWithProof.creatorHash),
      nonce: new BN(assetWithProof.nonce),
      index: assetWithProof.index,
    },
    proof,
    decompressedMetadata: {
      ...assetWithProof.metadata,
      collection,
      creators: assetWithProof.metadata.creators.map((creator) => {
        return {
          address: new PublicKey(creator.address.toString()),
          verified: creator.verified,
          share: creator.share,
        };
      }),
    },
  };
};
