use std::mem::size_of;

use anchor_lang::prelude::*;
use auction_house::{
    program::AuctionHouse,
    state::{Auction, Config},
    AnchorTransferInstructionArgs, VerifyAuctionArgs,
};
use mpl_bubblegum::{
    hash::{hash_creators, hash_metadata},
    instructions::{
        TransferCpi, TransferCpiAccounts, TransferInstructionArgs, UpdateMetadataCpi,
        UpdateMetadataCpiAccounts, UpdateMetadataInstructionArgs, VerifyCreatorCpi,
        VerifyCreatorCpiAccounts, VerifyCreatorInstructionArgs,
    },
    types::MetadataArgs,
    utils::get_asset_id,
};

use crate::{
    utils::mpl::AnchorUpdateMetadataInstructionArgs, Data, MyError, UnverifiedTokenHolder,
    VerificationCreator,
};

#[derive(Accounts)]
pub struct VerifyToAuction<'info> {
    #[account(mut)]
    pub data_account_authority: Signer<'info>,

    pub collection_authority: Signer<'info>,

    #[account(mut, seeds = [b"data_account"], bump)]
    pub data_account: Account<'info, Data>,

    /// CHECK: merkle_tree requires an account info
    #[account(mut)]
    pub merkle_tree: AccountInfo<'info>,

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

    // /// CHECK: used to sign creation
    // pub bubblegum_signer: UncheckedAccount<'info>,
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

    /// CHECK: checked by seeds and in IX body
    #[account(
            seeds = [
                b"unverified_token_holder",
                auction.seller.as_ref(),
                auction.asset_id.as_ref(),
            ],
            bump
        )]
    pub unverified_token_holder: AccountInfo<'info>,

    pub ah_program: Program<'info, AuctionHouse>,

    config: Account<'info, Config>,

    #[account(mut)]
    auction: Account<'info, Auction>,
}

pub fn verify_to_auction_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, VerifyToAuction<'info>>,
    args: AnchorUpdateMetadataInstructionArgs,
) -> Result<()> {
    if ctx.accounts.data_account.authority_account != ctx.accounts.data_account_authority.key() {
        return err!(MyError::InvalidAuthority);
    }

    let args = args.to_mpl_update_metadata_instruction_args();

    let generated_asset_id = get_asset_id(ctx.accounts.merkle_tree.key, args.nonce);
    require_keys_eq!(ctx.accounts.auction.asset_id, generated_asset_id);

    // Check received creators against the accountInfo
    let mut received_creators = match args.update_args.creators.clone() {
        Some(creators) => creators,
        None => return err!(MyError::InvalidCreatorsAmount),
    };

    const TOTAL_CREATORS: usize = 3;
    require_eq!(
        received_creators.len(),
        TOTAL_CREATORS,
        MyError::InvalidCreatorsAmount
    );
    require_keys_eq!(
        received_creators[1].address,
        ctx.accounts.mint_creator.key(),
        MyError::InvalidCreator
    );
    require_keys_eq!(
        received_creators[2].address,
        ctx.accounts.verification_creator.key(),
        MyError::InvalidCreator
    );

    let metadata = args.current_metadata.clone();
    let root = args.root;
    let nonce = args.nonce;
    let index = args.index;
    let data_hash = hash_metadata(&args.current_metadata)?;
    let creator_hash = hash_creators(&args.current_metadata.creators);

    let proof: Vec<(&AccountInfo<'info>, bool, bool)> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| (acc, false, false))
        .collect();

    // Update the metadata with the new creator (as unverified)
    let update_metadata_cpi_ix = UpdateMetadataCpi::new(
        &ctx.accounts.bubblegum_program,
        UpdateMetadataCpiAccounts {
            tree_config: &ctx.accounts.tree_config,
            authority: &ctx.accounts.collection_authority,
            collection_mint: Some(&ctx.accounts.collection_mint),
            collection_metadata: Some(&ctx.accounts.collection_metadata),
            collection_authority_record_pda: None,
            leaf_owner: &ctx.accounts.unverified_token_holder,
            leaf_delegate: &ctx.accounts.unverified_token_holder,
            payer: &ctx.accounts.data_account_authority,
            merkle_tree: &ctx.accounts.merkle_tree,
            log_wrapper: &ctx.accounts.log_wrapper,
            compression_program: &ctx.accounts.compression_program,
            token_metadata_program: &ctx.accounts.token_metadata_program,
            system_program: &ctx.accounts.system_program,
        },
        args,
    );
    update_metadata_cpi_ix.invoke_with_remaining_accounts(&proof)?;

    // Verify new creator in metadata
    let updated_creator_hash = hash_creators(&received_creators);

    let updated_metadata = MetadataArgs {
        name: metadata.name.clone(),
        symbol: metadata.symbol.clone(),
        uri: metadata.uri.clone(),
        seller_fee_basis_points: metadata.seller_fee_basis_points,
        primary_sale_happened: metadata.primary_sale_happened,
        is_mutable: metadata.is_mutable,
        edition_nonce: metadata.edition_nonce,
        token_standard: metadata.token_standard.clone(),
        collection: metadata.collection.clone(),
        uses: metadata.uses.clone(),
        token_program_version: metadata.token_program_version.clone(),
        creators: received_creators.clone(),
    };

    let updated_data_hash = hash_metadata(&updated_metadata)?;

    let verify_creator_cpi_ix = VerifyCreatorCpi::new(
        &ctx.accounts.bubblegum_program,
        VerifyCreatorCpiAccounts {
            tree_config: &ctx.accounts.tree_config,
            leaf_owner: &ctx.accounts.unverified_token_holder,
            leaf_delegate: &ctx.accounts.unverified_token_holder,
            merkle_tree: &ctx.accounts.merkle_tree,
            payer: &ctx.accounts.data_account_authority,
            creator: &ctx.accounts.verification_creator, // The creator to verify
            log_wrapper: &ctx.accounts.log_wrapper,
            compression_program: &ctx.accounts.compression_program,
            system_program: &ctx.accounts.system_program,
        },
        VerifyCreatorInstructionArgs {
            root,
            data_hash: updated_data_hash,
            creator_hash: updated_creator_hash,
            nonce,
            index,
            metadata: updated_metadata,
        },
    );
    verify_creator_cpi_ix.invoke_signed_with_remaining_accounts(
        &[&VerificationCreator::get_signer_seeds(&[ctx
            .bumps
            .verification_creator])],
        &proof,
    )?;

    // CPI to transfer LAND token and verify auction
    let verified_received_creators = &mut received_creators;
    verified_received_creators[2].verified = true;
    let updated_creator_hash = hash_creators(verified_received_creators);

    let verified_updated_metadata = MetadataArgs {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        seller_fee_basis_points: metadata.seller_fee_basis_points,
        primary_sale_happened: metadata.primary_sale_happened,
        is_mutable: metadata.is_mutable,
        edition_nonce: metadata.edition_nonce,
        token_standard: metadata.token_standard,
        collection: metadata.collection,
        uses: metadata.uses,
        token_program_version: metadata.token_program_version,
        creators: verified_received_creators.clone(),
    };

    let updated_data_hash = hash_metadata(&verified_updated_metadata)?;
    let bump = [ctx.bumps.unverified_token_holder];
    let holder_signer_seeds = &UnverifiedTokenHolder::get_signer_seeds(
        &ctx.accounts.auction.seller,
        &ctx.accounts.auction.asset_id,
        &bump,
    );

    auction_house::cpi::verify_auction(
        CpiContext::new_with_signer(
            ctx.accounts.ah_program.to_account_info(),
            auction_house::cpi::accounts::VerifyAuctionAccounts {
                land_pda_owner: ctx.accounts.unverified_token_holder.to_account_info(),
                config: ctx.accounts.config.to_account_info(),
                auction: ctx.accounts.auction.to_account_info(),
                merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                bubblegum_program: ctx.accounts.bubblegum_program.to_account_info(),
                tree_config: ctx.accounts.tree_config.to_account_info(),
                log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                compression_program: ctx.accounts.compression_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            &[holder_signer_seeds],
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        VerifyAuctionArgs {
            transfer_instruction_args: AnchorTransferInstructionArgs {
                root,
                data_hash: updated_data_hash,
                creator_hash: updated_creator_hash,
                nonce,
                index,
            },
        },
    )?;

    Ok(())
}
