#![allow(unused)]
use crate::*;
use anchor_lang::prelude::*;
use mpl_bubblegum::{
    instructions::{MintToCollectionV1CpiBuilder, MintV1CpiBuilder},
    types::MetadataArgs,
};

pub fn mint_token(ctx: Context<MintToken>, metadata_args: Vec<u8>) -> Result<()> {
    if ctx.accounts.data_account.authority_account != ctx.accounts.fee_payer.key() {
        return err!(MyError::InvalidAuthority);
    }

    let mint_metadata = MetadataArgs::try_from_slice(metadata_args.as_slice())?;

    // Check received creators against the accountInfos
    const TOTAL_CREATORS: usize = 3;
    require_eq!(
        mint_metadata.creators.len(),
        TOTAL_CREATORS,
        MyError::InvalidCreatorsAmount
    );
    require_keys_eq!(
        mint_metadata.creators[1].address,
        ctx.accounts.mint_creator.key(),
        MyError::InvalidCreator
    );
    require_keys_eq!(
        mint_metadata.creators[2].address,
        ctx.accounts.verification_creator.key(),
        MyError::InvalidCreator
    );

    MintToCollectionV1CpiBuilder::new(&ctx.accounts.bubblegum_program.to_account_info())
        .tree_config(&ctx.accounts.tree_config.to_account_info())
        .leaf_owner(&ctx.accounts.recipient.to_account_info())
        .leaf_delegate(&ctx.accounts.recipient.to_account_info())
        .merkle_tree(&ctx.accounts.merkle_tree.to_account_info())
        .payer(&ctx.accounts.fee_payer.to_account_info())
        .tree_creator_or_delegate(&ctx.accounts.fee_payer.to_account_info())
        .log_wrapper(&ctx.accounts.log_wrapper.to_account_info())
        .compression_program(&ctx.accounts.compression_program.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .collection_authority(&ctx.accounts.fee_payer.to_account_info())
        .collection_mint(&ctx.accounts.collection_mint.to_account_info())
        .collection_metadata(&ctx.accounts.collection_metadata.to_account_info())
        .collection_edition(&ctx.accounts.collection_edition.to_account_info())
        .bubblegum_signer(&ctx.accounts.bubblegum_signer.to_account_info())
        .token_metadata_program(&ctx.accounts.token_metadata_program.to_account_info())
        .metadata(mint_metadata)
        .add_remaining_account(&ctx.accounts.mint_creator, true, true)
        .add_remaining_account(&ctx.accounts.verification_creator, true, true)
        .invoke_signed(&[
            &MintCreator::get_signer_seeds(&[ctx.bumps.mint_creator]),
            &VerificationCreator::get_signer_seeds(&[ctx.bumps.verification_creator]),
        ])?;

    Ok(())
}
