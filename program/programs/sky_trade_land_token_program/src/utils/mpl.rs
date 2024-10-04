use anchor_lang::prelude::*;
use mpl_bubblegum::{
    instructions::UpdateMetadataInstructionArgs,
    types::{Collection, Creator, MetadataArgs, TokenProgramVersion, TokenStandard, UpdateArgs},
};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AnchorUpdateMetadataInstructionArgs {
    pub root: [u8; 32],
    pub nonce: u64,
    pub index: u32,
    pub current_metadata: AnchorMetadataArgs,
    pub update_args: AnchorUpdateArgs,
}

impl AnchorUpdateMetadataInstructionArgs {
    pub fn to_mpl_update_metadata_instruction_args(self) -> UpdateMetadataInstructionArgs {
        UpdateMetadataInstructionArgs {
            root: self.root,
            nonce: self.nonce,
            index: self.index,
            current_metadata: MetadataArgs {
                name: self.current_metadata.name,
                symbol: self.current_metadata.symbol,
                uri: self.current_metadata.uri,
                seller_fee_basis_points: self.current_metadata.seller_fee_basis_points,
                primary_sale_happened: self.current_metadata.primary_sale_happened,
                is_mutable: self.current_metadata.is_mutable,
                edition_nonce: None,
                token_standard: Some(TokenStandard::NonFungible),
                uses: None,
                token_program_version: TokenProgramVersion::Original,
                collection: self
                    .current_metadata
                    .collection
                    .map(|collection| Collection {
                        key: collection.key,
                        verified: collection.verified,
                    }),
                creators: self
                    .current_metadata
                    .creators
                    .into_iter()
                    .map(|creator| creator.to_mpl_creator())
                    .collect(),
            },
            update_args: self.update_args.to_mpl_update_args(),
        }
    }
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AnchorMetadataArgs {
    /// The name of the asset
    pub name: String,
    /// The symbol for the asset
    pub symbol: String,
    /// URI pointing to JSON representing the asset
    pub uri: String,
    /// Royalty basis points that goes to creators in secondary sales (0-10000)
    pub seller_fee_basis_points: u16,
    pub primary_sale_happened: bool,
    pub is_mutable: bool,
    /// Collection
    pub collection: Option<AnchorCollection>,
    pub creators: Vec<AnchorCreator>,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AnchorUpdateArgs {
    pub name: Option<String>,
    pub symbol: Option<String>,
    pub uri: Option<String>,
    pub creators: Option<Vec<AnchorCreator>>,
    pub seller_fee_basis_points: Option<u16>,
    pub primary_sale_happened: Option<bool>,
    pub is_mutable: Option<bool>,
}

impl AnchorUpdateArgs {
    pub fn to_mpl_update_args(self) -> UpdateArgs {
        UpdateArgs {
            name: self.name,
            symbol: self.symbol,
            uri: self.uri,
            creators: match self.creators {
                Some(creators) => {
                    let mpl_creators = creators
                        .into_iter()
                        .map(|creator| creator.to_mpl_creator())
                        .collect();

                    Some(mpl_creators)
                }
                None => None,
            },
            seller_fee_basis_points: self.seller_fee_basis_points,
            primary_sale_happened: self.primary_sale_happened,
            is_mutable: self.is_mutable,
        }
    }
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AnchorCollection {
    pub verified: bool,
    pub key: Pubkey,
}

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AnchorCreator {
    pub address: Pubkey,
    pub verified: bool,
    pub share: u8,
}

impl AnchorCreator {
    pub fn to_mpl_creator(self) -> Creator {
        Creator {
            address: self.address,
            verified: self.verified,
            share: self.share,
        }
    }
}
