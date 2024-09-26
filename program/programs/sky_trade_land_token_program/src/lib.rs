#![allow(unused)]
use anchor_lang::prelude::*;
use std::str::FromStr;
pub mod state;
pub mod stubs;
pub use state::*;

use mpl_bubblegum::instructions::UpdateMetadataInstructionArgs;
use stubs::*;

declare_id!("57Ubxrgvg5ju9Dhk6UUm76jVyrACJqwtxLPhkEaVHzrQ");

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

    /// Mints a new LAND cnft to our central account, without the verification creator signature
    pub fn mint_token_unverified(
        ctx: Context<MintTokenUnverified>,
        metadata_args: Vec<u8>,
    ) -> Result<()> {
        mint_token_unverified_handler(ctx, metadata_args)
    }

    /// Adds the signature for the second creator (`VerificationCreator`) and sends the token
    ///  to the property owner user
    pub fn add_verification_creator<'info>(
        ctx: Context<'_, '_, '_, 'info, AddVerificationCreator<'info>>,
        metadata_args: UpdateMetadataInstructionArgs,
    ) -> Result<()> {
        add_verification_creator_handler(ctx, metadata_args)
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

        /// CHECK: This account is checked in the instruction
        pub collection_mint: UncheckedAccount<'info>,

        #[account(mut)]
        /// CHECK: This account is checked in the instruction
        pub collection_metadata: UncheckedAccount<'info>,

        /// CHECK: This account is checked in the instruction
        pub collection_edition: UncheckedAccount<'info>,

        /// CHECK: used to sign creation
        pub bubblegum_signer: UncheckedAccount<'info>,

        /// CHECK: This account is checked in the instruction
        pub token_metadata_program: UncheckedAccount<'info>,

        /// CHECK: checked by seeds and in IX body
        // TODO!: remove mut once MPL bug is fixed
        #[account(mut, seeds = [b"mint_creator"], bump)]
        pub mint_creator: AccountInfo<'info>,

        /// CHECK: checked by seeds and in IX body
        // TODO!: remove mut once MPL bug is fixed
        #[account(mut, seeds = [b"verification_creator"], bump)]
        pub verification_creator: AccountInfo<'info>,
    }
}

#[error_code]
pub enum MyError {
    #[msg("Program already initialized!")]
    AlreadyInitialized,

    #[msg("Invalid authority provided!")]
    InvalidAuthority,

    #[msg("Invalid number of creators!")]
    InvalidCreatorsAmount,

    #[msg("Invalid creator!")]
    InvalidCreator,
}
