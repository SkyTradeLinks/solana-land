use anchor_lang::prelude::*;
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
