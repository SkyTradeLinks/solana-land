#![allow(unused)]
use crate::*;
use anchor_lang::prelude::*;

pub fn initialize(ctx: Context<InitializeAccounts>) -> Result<()> {
    ctx.accounts.data_account.initialized = true;
    ctx.accounts.data_account.authority_account = ctx.accounts.fee_payer.key();

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeAccounts<'info> {
    /// CHECK: fee_payer requires an account info
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(init, space= 8 + 1 + 32, payer=fee_payer, seeds = [b"data_account"], bump)]
    pub data_account: Account<'info, Data>,

    /// CHECK: system_program requires an account info
    pub system_program: Program<'info, System>,
}
