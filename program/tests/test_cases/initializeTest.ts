import { assert } from "chai";
import { InitialSetupData } from "../utils/initialSetup";

export const initializeTest = async (initialSetupData: InitialSetupData) => {
  const { program, wallet, connection } = initialSetupData;

  const tx = program.methods
    .initialize()
    .accounts({
      feePayer: wallet.publicKey,
    })
    .signers([wallet]);

  const dataAccount = (await tx.pubkeys()).dataAccount;
  const txSig = await tx.rpc();

  console.log("tx sig: ", txSig);
  await connection.confirmTransaction(txSig);

  const dataAccountData = await program.account.data.fetch(dataAccount);
  assert(dataAccountData);
};
