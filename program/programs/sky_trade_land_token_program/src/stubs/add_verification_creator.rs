use anchor_lang::prelude::*;
use mpl_bubblegum::{
    hash::{hash_creators, hash_metadata},
    instructions::{
        TransferCpi, TransferCpiAccounts, TransferInstructionArgs, UpdateMetadataCpi,
        UpdateMetadataCpiAccounts, UpdateMetadataInstructionArgs, VerifyCreatorCpi,
        VerifyCreatorCpiAccounts, VerifyCreatorInstructionArgs,
    },
};

use crate::{Data, MyError, VerificationCreator};

#[derive(Accounts)]
pub struct AddVerificationCreator<'info> {
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

    // /// CHECK: used to sign creation
    // pub bubblegum_signer: UncheckedAccount<'info>,
    /// CHECK: This account is checked in the instruction
    pub token_metadata_program: UncheckedAccount<'info>,

    /// CHECK: checked by seeds and in IX body
    // TODO!: remove mut once MPL bug is fixed
    #[account(mut, seeds = [b"verification_creator"], bump)]
    pub verification_creator: AccountInfo<'info>,
}

pub fn add_verification_creator_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, AddVerificationCreator<'info>>,
    args: UpdateMetadataInstructionArgs,
) -> Result<()> {
    // Check received creators against the accountInfo
    const TOTAL_CREATORS: usize = 3;
    require_eq!(
        args.current_metadata.creators.len(),
        TOTAL_CREATORS,
        MyError::InvalidCreatorsAmount
    );
    require_keys_eq!(
        args.current_metadata.creators[2].address,
        ctx.accounts.verification_creator.key(),
        MyError::InvalidCreator
    );

    let creators = &args.current_metadata.creators;
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
            authority: &ctx.accounts.fee_payer,
            collection_mint: Some(&ctx.accounts.collection_mint),
            collection_metadata: Some(&ctx.accounts.collection_metadata),
            collection_authority_record_pda: None,
            leaf_owner: &ctx.accounts.fee_payer,
            leaf_delegate: &ctx.accounts.fee_payer,
            payer: &ctx.accounts.fee_payer,
            merkle_tree: &ctx.accounts.merkle_tree,
            log_wrapper: &ctx.accounts.log_wrapper,
            compression_program: &ctx.accounts.compression_program,
            token_metadata_program: &ctx.accounts.token_metadata_program,
            system_program: &ctx.accounts.system_program,
        },
        args,
    );
    update_metadata_cpi_ix.invoke_with_remaining_accounts(&proof);

    // Verify new creator in metadata
    let verify_creator_cpi_ix = VerifyCreatorCpi::new(
        &ctx.accounts.bubblegum_program,
        VerifyCreatorCpiAccounts {
            tree_config: &ctx.accounts.tree_config,
            leaf_owner: &ctx.accounts.fee_payer,
            leaf_delegate: &ctx.accounts.fee_payer,
            merkle_tree: &ctx.accounts.merkle_tree,
            payer: &ctx.accounts.fee_payer,
            creator: &ctx.accounts.verification_creator, // The creator to verify
            log_wrapper: &ctx.accounts.log_wrapper,
            compression_program: &ctx.accounts.compression_program,
            system_program: &ctx.accounts.system_program,
        },
        VerifyCreatorInstructionArgs {
            root,
            data_hash,
            creator_hash,
            nonce,
            index,
            metadata,
        },
    );

    verify_creator_cpi_ix.invoke_signed_with_remaining_accounts(
        &[&VerificationCreator::get_signer_seeds(&[ctx
            .bumps
            .verification_creator])],
        &proof,
    );

    // Transfer cNFT to land owner
    let transfer_cpi_ix = TransferCpi::new(
        &ctx.accounts.bubblegum_program,
        TransferCpiAccounts {
            new_leaf_owner: &ctx.accounts.recipient,
            tree_config: &ctx.accounts.tree_config,
            leaf_owner: (&ctx.accounts.fee_payer, true),
            leaf_delegate: (&ctx.accounts.fee_payer, true),
            merkle_tree: &ctx.accounts.merkle_tree,
            log_wrapper: &ctx.accounts.log_wrapper,
            compression_program: &ctx.accounts.compression_program,
            system_program: &ctx.accounts.system_program,
        },
        TransferInstructionArgs {
            root,
            data_hash,
            creator_hash,
            nonce,
            index,
        },
    );

    transfer_cpi_ix.invoke_with_remaining_accounts(&proof);

    Ok(())
}
