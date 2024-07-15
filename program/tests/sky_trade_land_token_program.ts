import * as anchor from '@coral-xyz/anchor';
import * as skyTradeLandTokenProgramClient from '../client/sky_trade_land_token_program';
import chai from 'chai';
import { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { findLeafIndexFromUmiTx, loadKeyPair, sleep } from '../helper';
import { join } from 'path';
import {
  createSignerFromKeypair,
  percentAmount,
  publicKey,
  signerIdentity,
  some,
  Umi,
} from '@metaplex-foundation/umi';

import {
  findTreeConfigPda,
  mplBubblegum,
  UpdateArgsArgs,
  getAssetWithProof,
  updateMetadata,
  findLeafAssetIdPda,
  getMetadataArgsSerializer,
  TokenProgramVersion,
  TokenStandard,
} from '@metaplex-foundation/mpl-bubblegum';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { decode } from '@coral-xyz/anchor/dist/cjs/utils/bytes/bs58';
import { PublicKey } from '@solana/web3.js';
import 'dotenv/config';
import {
  createNft,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import { createCollection } from '@metaplex-foundation/mpl-core';

chai.use(chaiAsPromised);

describe('workspace', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();

  anchor.setProvider(provider);

  const dataAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('data_account')],
    skyTradeLandTokenProgramClient.PROGRAM_PUBKEY
  )[0];

  const merkleTreeAddr = new anchor.web3.PublicKey(
    'BQi6mDUZVwJvSV3PcWHTVFtP5jRgFDPNrqnTJYhv5c6B'
  );

  const feePayer = loadKeyPair(
    join(__dirname, 'wallets', 'centralizedAccount.json')
  );
  const collection = loadKeyPair('../wallets/collection.json');
  const recipient = new anchor.web3.PublicKey(
    '73ajJBDet2TbccHesc1CgHcMbDG83fafiy5iP3iGCEYL'
  );

  const umi = createUmi(provider.connection.rpcEndpoint)
    .use(mplTokenMetadata())
    .use(mplBubblegum())
    .use(dasApi());

  const treeConfig = findTreeConfigPda(umi, {
    merkleTree: publicKey(merkleTreeAddr),
  })[0];

  umi.use(
    signerIdentity(
      createSignerFromKeypair(umi, {
        secretKey: feePayer.secretKey,
        publicKey: publicKey(feePayer.publicKey),
      })
    )
  );

  it('should initialize', async () => {
    // await skyTradeLandTokenProgramClient.InitializeSendAndConfirm(
    //   dataAccount,
    //   merkleTreeAddr,
    //   feePayer
    // );
  });

  it('should mint token', async () => {
    // const collectionMint = new PublicKey(
    //   '3DKPEzjcaEB5ftTFmShRTmPojTpwwj7zVmDKhhSLwiYk'
    // );

    const collectionMint = collection.publicKey;
    const collectionSigner = createSignerFromKeypair(umi, {
      secretKey: collection.secretKey,
      publicKey: publicKey(collection.publicKey),
    });
    const collectionTx = await createNft(umi, {
      mint: collectionSigner,
      name: 'LAND Collection',
      uri: 'https://example.com/my-collection.json',
      sellerFeeBasisPoints: percentAmount(0), // 5.5%
      isCollection: true,
    });
    const { blockhash, lastValidBlockHeight } =
      await umi.rpc.getLatestBlockhash();
    const collectionSig = await collectionTx.sendAndConfirm(umi, {
      send: { commitment: 'finalized' },
      confirm: {
        strategy: { type: 'blockhash', blockhash, lastValidBlockHeight },
      },
    });

    const metadata_args = getMetadataArgsSerializer().serialize({
      name: 'Land NFT',
      symbol: '',
      uri: '',
      creators: [
        { address: umi.identity.publicKey, verified: true, share: 100 },
      ],
      sellerFeeBasisPoints: 0,
      primarySaleHappened: false,
      isMutable: true,
      editionNonce: null,
      uses: null,
      collection: { key: publicKey(collectionMint), verified: true },
      tokenProgramVersion: TokenProgramVersion.Original,
      tokenStandard: TokenStandard.NonFungible,
    });

    const mintSx = await skyTradeLandTokenProgramClient.MintTokenSendAndConfirm(
      umi as Umi,
      Buffer.from(metadata_args),
      dataAccount,
      merkleTreeAddr,
      recipient,
      new anchor.web3.PublicKey(treeConfig),
      collectionMint,
      feePayer
    );

    let mintTxInfo;

    let i = 1;

    while (i < 6) {
      const tx0 = await umi.rpc.getTransaction(decode(mintSx), {
        commitment: 'confirmed',
      });

      if (tx0 !== null) {
        mintTxInfo = tx0;
        break;
      }

      await sleep(1000 * i);

      i++;
    }

    let leafIndex = findLeafIndexFromUmiTx(mintTxInfo);

    console.log(leafIndex);
  });

  // it("test update", async () => {
  //   const updateArgs: UpdateArgsArgs = {
  //     uri: some("https://updated-example.com/my-nft.json"),
  //   };

  //   let leafIndex = 4;

  //   const [assetId, bump] = findLeafAssetIdPda(umi, {
  //     merkleTree: publicKey(merkleTreeAddr),
  //     leafIndex: leafIndex,
  //   });

  //   const assetWithProof = await getAssetWithProof(umi, assetId);

  //   await updateMetadata(umi, {
  //     ...assetWithProof,
  //     leafOwner: assetWithProof.leafOwner,
  //     currentMetadata: assetWithProof.metadata,
  //     updateArgs,
  //   }).sendAndConfirm(umi);
  // });
});
