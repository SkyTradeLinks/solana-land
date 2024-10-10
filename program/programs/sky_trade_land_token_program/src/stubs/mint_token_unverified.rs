use anchor_lang::{prelude::*, solana_program::program::get_return_data};
use mpl_bubblegum::{
    instructions::{MintToCollectionV1CpiBuilder, MintV1CpiBuilder},
    types::{LeafSchema, MetadataArgs},
    LeafSchemaEvent, ID,
};

use crate::{Data, LeafSchemaMpl, MintCreator, MyError};

#[derive(Accounts)]
pub struct MintTokenUnverified<'info> {
    /// CHECK: fee_payer requires an account info
    #[account(mut, signer)]
    pub fee_payer: AccountInfo<'info>,

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

    /// CHECK: Only used as a seed for the `unverified_token_holder` account
    pub property_owner_user_wallet: UncheckedAccount<'info>,
    /// CHECK: Only used as a seed for the `unverified_token_holder` account
    pub asset_id: UncheckedAccount<'info>,
    /// CHECK: checked by seeds and in IX body
    #[account(
        seeds = [
            b"unverified_token_holder",
            property_owner_user_wallet.key().as_ref(),
            asset_id.key().as_ref(),
        ],
        bump
    )]
    pub unverified_token_holder: AccountInfo<'info>,
}

impl<'info> MintTokenUnverified<'info> {
    /// Checks that the created asset_id in CPI matches the one received
    ///  to be used as a seed for the [`unverified_token_holder`] account
    pub fn validate_asset_id(&self) -> Result<()> {
        let leaf_data = match get_return_data() {
            Some((program_id, cpi_data)) => {
                require_keys_eq!(
                    program_id,
                    self.bubblegum_program.key(),
                    MyError::InvalidAssetId
                );
                LeafSchemaMpl::try_from_slice(&cpi_data)?
            }
            None => return err!(MyError::InvalidAssetId),
        };

        match leaf_data {
            LeafSchemaMpl::V1 { id, .. } => {
                require_keys_eq!(id, self.asset_id.key(), MyError::InvalidAssetId)
            }
        }

        Ok(())
    }
}

pub fn mint_token_unverified_handler(
    ctx: Context<MintTokenUnverified>,
    metadata_args: Vec<u8>,
) -> Result<()> {
    if ctx.accounts.data_account.authority_account != ctx.accounts.fee_payer.key() {
        return err!(MyError::InvalidAuthority);
    }

    let mint_metadata = MetadataArgs::try_from_slice(metadata_args.as_slice())?;

    // Check received creators against the accountInfos
    const TOTAL_CREATORS: usize = 2;
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

    MintToCollectionV1CpiBuilder::new(&ctx.accounts.bubblegum_program.to_account_info())
        .tree_config(&ctx.accounts.tree_config.to_account_info())
        .leaf_owner(&ctx.accounts.unverified_token_holder.to_account_info())
        .leaf_delegate(&ctx.accounts.unverified_token_holder.to_account_info())
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
        .invoke_signed(&[&MintCreator::get_signer_seeds(&[ctx.bumps.mint_creator])])?;

    ctx.accounts.validate_asset_id()?;

    Ok(())
}
