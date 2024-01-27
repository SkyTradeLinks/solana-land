use anchor_lang::prelude::*;
#[account]
pub struct Data {
    pub initialized: bool,
    pub authority_account: Pubkey,
    pub merkle_tree_address: Pubkey,
}
