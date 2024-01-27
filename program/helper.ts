import * as fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import { TransactionWithMeta } from "@metaplex-foundation/umi";
import { SPL_NOOP_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import { deserializeChangeLogEventV1 } from "@solana/spl-account-compression";

export const loadKeyPair = (filename) => {
  const decodedKey = new Uint8Array(
    JSON.parse(fs.readFileSync(filename).toString())
  );

  let keyPair = anchor.web3.Keypair.fromSecretKey(decodedKey);

  return keyPair;
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const findLeafIndexFromUmiTx = (txInfo: TransactionWithMeta) => {
  let leafIndex: number | undefined = undefined;

  let innerInstructions = txInfo.meta.innerInstructions;

  for (let i = innerInstructions.length - 1; i >= 0; i--) {
    for (let j = innerInstructions[i].instructions.length - 1; j >= 0; j--) {
      const instruction = innerInstructions[i].instructions[j];

      const programId = txInfo.message.accounts[instruction.programIndex];

      if (programId.toString() == SPL_NOOP_PROGRAM_ID.toString()) {
        try {
          const changeLogEvent = deserializeChangeLogEventV1(
            Buffer.from(instruction.data)
          );

          leafIndex = changeLogEvent?.index;
        } catch (__) {
          // do nothing, invalid data is handled just after the for loop
        }
      }
    }
  }

  //
  return leafIndex;
};
