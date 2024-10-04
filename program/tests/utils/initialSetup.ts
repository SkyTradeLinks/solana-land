import {
  AnchorProvider,
  Wallet,
  setProvider,
  workspace,
  Program,
} from "@coral-xyz/anchor";
import {
  findTreeConfigPda,
  MPL_BUBBLEGUM_PROGRAM_ID,
  mplBubblegum,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { SkyTradeLandTokenProgram } from "../../target/types/sky_trade_land_token_program";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createCollection } from "./mpl/createCollection";
import {
  createSignerFromKeypair,
  keypairIdentity,
  publicKey,
  Umi,
} from "@metaplex-foundation/umi";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { createMplTree } from "./mpl/createTree";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";

export interface InitialSetupData {
  wallet: Keypair;
  connection: Connection;
  program: Program<SkyTradeLandTokenProgram>;
  umi: Umi;
  umiDas: Umi;
  dataAccount: PublicKey;
  mintCreator: PublicKey;
  verificationCreator: PublicKey;
  collection: { key: PublicKey; authority: Keypair };
  merkleTree: PublicKey;
  treeConfig: PublicKey;
  bubblegumSigner: PublicKey;
  collectionMetadata: PublicKey;
  collectionEdition: PublicKey;
}

export const initialSetup = async (): Promise<InitialSetupData> => {
  const commitment = "confirmed";
  const connection = new Connection("http://localhost:8899", {
    commitment,
  });
  const umiDasConnection = new Connection("http://localhost:9090", {
    commitment,
  });

  //Fund wallet
  const wallet = Keypair.generate();
  const sig = await connection.requestAirdrop(
    wallet.publicKey,
    10 * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(sig);

  // Anchor setup
  const provider = new AnchorProvider(connection, new Wallet(wallet));
  setProvider(provider);

  const program =
    workspace.SkyTradeLandTokenProgram as Program<SkyTradeLandTokenProgram>;

  // Umi setup
  const umi = createUmi(connection)
    .use(mplTokenMetadata())
    .use(mplBubblegum())
    .use(dasApi())
    .use(mplToolbox());

  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(wallet.secretKey);
  umi.use(keypairIdentity(umiKeypair));

  const umiDas = createUmi(umiDasConnection)
    .use(mplTokenMetadata())
    .use(mplBubblegum())
    .use(dasApi());

  // PDAs:
  const [dataAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("data_account")],
    program.programId
  );

  const [mintCreator] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_creator")],
    program.programId
  );

  const [verificationCreator] = PublicKey.findProgramAddressSync(
    [Buffer.from("verification_creator")],
    program.programId
  );

  // Collection Setup: (we force the collection auth to be the same account as the `authority_account`
  //  pubkey saved in the `Data` account in the mint cpi)
  const umiCollectionAuth = createSignerFromKeypair(umi, umiKeypair);
  const collection = await createCollection(umi, umiCollectionAuth);

  // merkleTree Setup: (we force the tree creator to be the same account as the `authority_account`
  //  pubkey saved in the `Data` account in the mint cpi)
  const umiTreeCreator = createSignerFromKeypair(umi, umiKeypair);
  const { merkleTree } = await createMplTree(umi, umiTreeCreator);

  // MPL PDAs:
  const [treeConfig] = findTreeConfigPda(umiDas, {
    merkleTree: publicKey(merkleTree),
  });

  const [bubblegumSigner] = PublicKey.findProgramAddressSync(
    // `collection_cpi` is a custom prefix required by the Bubblegum program
    [Buffer.from("collection_cpi", "utf8")],
    new PublicKey(MPL_BUBBLEGUM_PROGRAM_ID)
  );

  let [collectionMetadata] = findMetadataPda(umi, {
    mint: publicKey(collection.key),
  });

  let [collectionEdition] = findMasterEditionPda(umi, {
    mint: publicKey(collection.key),
  });

  return {
    wallet,
    connection,
    program,
    umi,
    umiDas,
    dataAccount,
    mintCreator,
    verificationCreator,
    collection,
    merkleTree,
    treeConfig: new PublicKey(treeConfig),
    bubblegumSigner,
    collectionMetadata: new PublicKey(collectionMetadata),
    collectionEdition: new PublicKey(collectionEdition),
  };
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
