use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};
#[account]
pub struct Data {
    pub initialized: bool,
    pub authority_account: Pubkey,
}

pub struct MintCreator;
impl MintCreator {
    pub fn get_signer_seeds(bump: &[u8]) -> [&[u8]; 2] {
        [b"mint_creator", bump]
    }
}

pub struct VerificationCreator;
impl VerificationCreator {
    pub fn get_signer_seeds(bump: &[u8]) -> [&[u8]; 2] {
        [b"verification_creator", bump]
    }
}

pub struct UnverifiedTokenHolder;
impl UnverifiedTokenHolder {
    pub fn get_signer_seeds<'a>(
        user_wallet: &'a Pubkey,
        asset_id: &'a Pubkey,
        bump: &'a [u8],
    ) -> [&'a [u8]; 4] {
        [
            b"unverified_token_holder",
            user_wallet.as_ref(),
            asset_id.as_ref(),
            bump,
        ]
    }
}

#[derive(BorshSerialize, BorshDeserialize, PartialEq, Eq, Debug, Clone)]
pub enum LeafSchemaMpl {
    V1 {
        id: Pubkey,
        owner: Pubkey,
        delegate: Pubkey,
        nonce: u64,
        data_hash: [u8; 32],
        creator_hash: [u8; 32],
    },
}
