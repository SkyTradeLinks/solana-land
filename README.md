# Sky Trades

## Overview

A multi-component system for the planet's first decentralized 3D Airspace Registry tailored for property owners. This gives property owners the ability to earn passive income from UAV's which fly over their property.

We make this airspace available via smart contracts which mints rental tokens for a specified time-range to UAVs and traders for a fee. These proceeds are then distributed among the underlying air parcel owners whose airspace is traversed by the UAVs.

## Design Overview

## Technology Stack

- [Next.js](https://nextjs.org/)
- [Nest.js](https://nestjs.com/)
- [PostgreSQL](https://postgresql.org/)
- [Solana](https://solana.com/)
- [Anchor](https://www.anchor-lang.com/)
- [Codigo.ai](https://www.codigo.ai/)

## Core Components, Protocols, and Architecture

### Client Facing UI / Backend

This is our user interface whereby users have the ability to register their land properties, as well as claim an airspace. Furthermore, drone operators can also use this same UI to rent airspaces for a specified timeframe, facilitating a marketplace where airspaces can be easily rented with the press of a button.

### Admin UI / Backend

This is our user interface, designed for admin users. Within this UI, we receive requests for property verifications, where once we have validated this claim, we mint a land token specifically for such property.This token enables owners to be able to rent out the airspace belonging to the property.


### Smart Contracts (Rental and Land cNFT)

This was developed in solana, utilizing the metaplex bubblegum standard, which is used for compressed nfts, saving costs, as well as ensuring it's decentralized and unique. The land token is minted once the properties have been verified, while the rental token utilizes existing land tokens as a source of truth, while having a time component to it, ensuring problems of double booking are non-existent.

### Drones Radar

### Map Box Integration

### Persona KYC Integration

## Demo

### Airspace Registration

This includes users claiming an airspace, and providing us with the necessary documents to support this claim. This is then reviewed further.

Here is an overview of the User Interface for Registering An Airspace:
https://www.loom.com/share/66a8175f270b48e48b634db7d0fe1427?sid=885bed63-02e0-486f-a49e-63bf078ce93a

### Verifying Airspace

In this phase, once we have verified the airspace claim, we then proceed to mint a land nft which is unique and belongs to the owner, making him the sole proprietor for airspace rights.

Here is an overview of the minting process, as well as the admin UI:
https://www.loom.com/share/debbe058aaec409fadce8d0bb3688f64?sid=4ebe44f2-f9a3-4ccb-9d29-76a53a9dbb49

### Renting Airspace

Finally, drone operators then locate verified airspaces, and proceed to rent them for a fee. This process mints a rental nft valid for a specific timeframe, as well as distributes the fee to the land owner.

Here is an overview of the UI for the minting process:
https://www.loom.com/share/ef2fa9bc3d0f4c47851cabb4f12b1963?sid=57b5dafb-6446-4699-a65c-2603a541d111

## Acknowledgments

Jonathan Dockrell, Marcin Zduniak

https://sky.trade/
