#![allow(unused)]
use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateConfigAccounts<'info> {
    /// CHECK: fee_payer requires an account info
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(seeds = [b"data_account"], bump)]
    pub data_account: Account<'info, Data>,

    #[account()]
    /// CHECK: no check required
    pub new_authority: AccountInfo<'info>,

    /// CHECK: system_program requires an account info
    pub system_program: Program<'info, System>,
}

pub fn update_config(ctx: Context<UpdateConfigAccounts>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.data_account.authority_account,
        ctx.accounts.fee_payer.key(),
        MyError::InvalidAuthority
    );

    ctx.accounts.data_account.authority_account = ctx.accounts.new_authority.key();

    Ok(())
}
