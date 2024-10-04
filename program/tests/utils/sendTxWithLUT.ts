import {
  Signer,
  TransactionInstruction,
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
} from "@solana/web3.js";
import { Provider } from "@coral-xyz/anchor";

export const sendTxWithLUT = async (
  provider: Provider,
  payer: Signer,
  ix: TransactionInstruction,
  lookupTable?: PublicKey,
  additionalSigners?: Signer[],
  skipPreflight = false
) => {
  let lookupTableAccounts = [];
  if (lookupTable) {
    const lookupTableAccount = (
      await provider.connection.getAddressLookupTable(lookupTable)
    ).value;
    lookupTableAccounts.push(lookupTableAccount);
  }

  const signers = additionalSigners ? [payer, ...additionalSigners] : [payer];

  const setComputeUnitsIX = ComputeBudgetProgram.setComputeUnitLimit({
    units: 300000,
  });

  const recentBlockhash = await provider.connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: recentBlockhash.blockhash,
    instructions: [setComputeUnitsIX, ix],
  }).compileToV0Message(lookupTableAccounts);
  const transactionV0 = new VersionedTransaction(messageV0);
  transactionV0.sign(signers);

  const tx = await provider.connection
    .sendTransaction(transactionV0, {
      skipPreflight,
    })
    .catch((e) => console.log(e));
  console.log("Your transaction signature", tx);

  return tx;
};
