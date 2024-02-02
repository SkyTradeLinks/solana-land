#![allow(unused)]
use anchor_lang::prelude::*;
use std::str::FromStr;
pub mod stubs;
pub use stubs::*;
pub mod state;
pub use state::*;

declare_id!("42GHMDntDvfvtArboFMRPj78jvTfBNr5Ce4FBpCZiyzM");

#[program]
pub mod sky_trade_land_token_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        stubs::initialize::initialize(ctx)
    }

    #[derive(Accounts)]
    pub struct Initialize<'info> {
        /// CHECK: fee_payer requires an account info
        #[account(mut, signer)]
        pub fee_payer: AccountInfo<'info>,
        #[account(init_if_needed, space=73, payer=fee_payer, seeds = [b"data_account"], bump)]
        pub data_account: Account<'info, Data>,

        /// CHECK: merkle_tree requires an account info
        pub merkle_tree: AccountInfo<'info>,

        /// CHECK: system_program requires an account info
        pub system_program: Program<'info, System>,
    }

    pub fn mint_token(ctx: Context<MintToken>, metadata_args: Vec<u8>) -> Result<()> {
        stubs::mint_token::mint_token(ctx, metadata_args)
    }

    #[derive(Accounts)]
    #[instruction(metadata_args:Vec<u8>)]
    pub struct MintToken<'info> {
        /// CHECK: fee_payer requires an account info
        #[account(mut, signer)]
        pub fee_payer: AccountInfo<'info>,

        #[account(mut, seeds = [b"data_account"], bump)]
        pub data_account: Account<'info, Data>,

        /// CHECK: merkle_tree requires an account info
        #[account(mut)]
        pub merkle_tree: AccountInfo<'info>,

        /// CHECK: recipient requires an account info
        #[account(mut)]
        pub recipient: AccountInfo<'info>,

        /// CHECK: tree_config requires an account info
        #[account(mut)]
        pub tree_config: AccountInfo<'info>,

        /// CHECK: bubblegum_program requires an account info
        pub bubblegum_program: AccountInfo<'info>,

        /// CHECK: log_wrapper requires an account info
        pub log_wrapper: AccountInfo<'info>,

        /// CHECK: compression_program requires an account info
        pub compression_program: AccountInfo<'info>,

        /// CHECK: system_program requires an account info
        pub system_program: Program<'info, System>,
    }
}

#[error_code]
pub enum MyError {
    #[msg("Program already initialized!")]
    AlreadyInitialized,

    #[msg("Invalid authority provided!")]
    InvalidAuthority,

    #[msg("Provided Tree Address is invalid")]
    InvalidTreeAddressPassed,
}
