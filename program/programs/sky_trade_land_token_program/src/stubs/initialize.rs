#![allow(unused)]
use crate::*;
use anchor_lang::prelude::*;

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    if ctx.accounts.data_account.initialized {
        return err!(MyError::InvalidTreeAddressPassed);
    }

    ctx.accounts.data_account.initialized = true;
    ctx.accounts.data_account.merkle_tree_address = ctx.accounts.merkle_tree.key();
    ctx.accounts.data_account.authority_account = ctx.accounts.fee_payer.key();

    Ok(())
}
