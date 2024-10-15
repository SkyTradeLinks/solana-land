#![allow(unused)]
use anchor_lang::prelude::*;
use std::str::FromStr;
pub mod state;
pub mod stubs;
pub mod utils;

pub use state::*;
use stubs::*;

use utils::mpl::AnchorUpdateMetadataInstructionArgs;

declare_id!("CwJS5Jh7TfgXCEBGEcYMnwhvsVmztxTVx819qDHhEHKj");

#[program]
pub mod sky_trade_land_token_program {
    use super::*;

    pub fn initialize(ctx: Context<InitializeAccounts>) -> Result<()> {
        stubs::initialize::initialize(ctx)
    }

    pub fn update_config(ctx: Context<UpdateConfigAccounts>) -> Result<()> {
        stubs::update_config::update_config(ctx)
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
        metadata_args: AnchorUpdateMetadataInstructionArgs,
    ) -> Result<()> {
        add_verification_creator_handler(ctx, metadata_args)
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

    #[msg("InvalidAssetId!")]
    InvalidAssetId,

    #[msg("GenericError!")]
    GenericError,
}
