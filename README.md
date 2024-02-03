# Sky Trade

## Overview

A multi-component system for the planet's first decentralized 3D Airspace Registry tailored for property owners. This gives property owners the ability to earn passive income from UAV's which fly over their property.

We make this airspace available via smart contracts which mints rental tokens for a specified time-range to UAVs and traders for a fee. These proceeds are then distributed among the underlying air parcel owners whose airspace is traversed by the UAVs.

## Sequence Overview

![Sequence Diagram](diagrams/system_sequence_diagram.png)

_Sequence Diagram of SkyTrade_

## Technology Stack

- [Next.js](https://nextjs.org/)
- [Nest.js](https://nestjs.com/)
- [PostgreSQL](https://postgresql.org/)
- [Solana](https://solana.com/)
- [Anchor](https://www.anchor-lang.com/)
- [Codigo.ai](https://www.codigo.ai/)
- [Solana FM](https://solana.fm/)
- [Ironforge](https://www.ironforge.cloud/)
- [Web3Auth](https://web3auth.io/)

## Core Components, Protocols, and Architecture

![Architecure Diagram](diagrams/architecture_diagram.png)

_Architecure Diagram Diagram of Core Components_

### Client Facing UI / API

This is our user interface whereby users have the ability to register their land properties, as well as claim an airspace. Furthermore, drone operators can also use this same UI to rent airspaces for a specified timeframe, facilitating a marketplace where airspaces can be easily rented with the press of a button.

### Admin UI / API

This is our user interface, designed for admin users. Within this UI, we receive requests for property verifications, where once we have validated this claim, we mint a land token specifically for such property.This token enables owners to be able to rent out the airspace belonging to the property.

### Smart Contracts (Rental and Land cNFT)

This was developed in solana, utilizing the metaplex bubblegum standard, which is used for compressed nfts, saving costs, as well as ensuring it's decentralized and unique. The land token is minted once the properties have been verified, while the rental token utilizes existing land tokens as a source of truth, while having a time component to it, ensuring problems of double booking are non-existent.

### Drones Radar Network

The radar network captures crucial information such as speed, serial ID, altitude, and other relevant data for every airspace entry, allowing users to track and review historical activities. To bolster airspace security, we employ a robust system that integrates open-source software and leverages data emitted by drones during flights. This information is used by the radar network to promptly alert users to any unauthorized entries.

### Map Box Integration

We further assist users in accurately inputting addresses through [Mapbox](https://www.mapbox.com/), facilitating seamless address or GPS selection. This not only enhances user experience but also enables us to verify land details by retrieving essential information, including surface area, longitude, and latitude.

### Persona KYC Integration

We also ensure that landowners on our system are verifiable individuals. To achieve this, we have integrated [Persona](https://withpersona.com/) into the app. Persona helps us verify the identity of users, enhancing the overall reliability of our platform.

## Demo

### Live Demo Instructions

- Navigate to https://dev.sky.trade/ and sign up!
- Either Claim An Airspace (Reach out to have your property whitelisted at m@sky.trade)
- Or rent out already verified airspaces, namely
  - 1313 Riverside Ave Fort Collins CO
  - 10, Downing Street, Westminster, Covent Garden, London, Greater London, England, SW1A 2AA, United Kingdom
  - 50, California Street, Financial District, San Francisco, California, 94111, USA
  - Chetla, Kolkata, Kolkata, West Bengal, India

### Airspace Registration

This includes users claiming an airspace, and providing us with the necessary documents to support this claim. This is then reviewed further.

Here is an overview of the User Interface for Registering An Airspace (click for full recording):

<div>
    <a href="https://www.loom.com/share/66a8175f270b48e48b634db7d0fe1427" target="_blank">
        <img src="https://cdn.loom.com/sessions/thumbnails/66a8175f270b48e48b634db7d0fe1427-with-play.gif">
    </a>
</div>

### Verifying Airspace

In this phase, once we have verified the airspace claim, we then proceed to mint a land NFT which is unique and belongs to the owner, making him the sole proprietor for airspace rights.

Here is an overview of the minting process, as well as the admin UI (click for full recording):

<div>
    <a href="https://www.loom.com/share/debbe058aaec409fadce8d0bb3688f64" target="_blank">
        <img src="https://cdn.loom.com/sessions/thumbnails/debbe058aaec409fadce8d0bb3688f64-with-play.gif">
    </a>
</div>

### Renting Airspace

Finally, drone operators then locate verified airspaces, and proceed to rent them for a fee. This process mints a rental nft valid for a specific timeframe, as well as distributes the fee to the land owner.

Here is an overview of the UI for the minting process (click for full recording):

<div>
    <a href="https://www.loom.com/share/ef2fa9bc3d0f4c47851cabb4f12b1963" target="_blank">
        <img src="https://cdn.loom.com/sessions/thumbnails/ef2fa9bc3d0f4c47851cabb4f12b1963-with-play.gif">
    </a>
</div>

## Project Screenshots

<img src="https://res.cloudinary.com/erenaspire7/image/upload/v1706818633/jhtcvkyu4ve4wjqqh2ym.png">

_Auth Page_

<img src="https://res.cloudinary.com/erenaspire7/image/upload/v1706818634/havrfs3uvxd3x7zsmufd.png">

_Dashboard Page_

<img src="https://res.cloudinary.com/erenaspire7/image/upload/v1706818634/uadqt2sspagxbbcxtqwj.png">

_Claim Airspace UI_

<img src="https://res.cloudinary.com/erenaspire7/image/upload/v1706818634/ibpzb3fm8reck0pjykdu.png">

_Rent Airspace UI_

<img src="https://res.cloudinary.com/erenaspire7/image/upload/v1706818634/grdpgnhtguy1z7rglxs7.png">

_Modal with expected date and time_

## UI/UX Designs

Explore our UI/UX designs on [Figma](https://www.figma.com/file/NwkvHLwU7u52LdxKg37x14/sky-trade?type=design&node-id=33-90&mode=design&t=LtQm2TN7Wlayb7ik-0).

## Other Component Repositories

- https://github.com/SkyTradeLinks/address-claiming/tree/dev-deploy
- https://github.com/SkyTradeLinks/solana-rental
- https://github.com/SkyTradeLinks/backend/tree/dev-deploy
- https://github.com/SkyTradeLinks/admin_backend
- https://github.com/SkyTradeLinks/admin_ui

## Acknowledgments

- [Jonathan Dockrell](https://www.linkedin.com/in/jonathandockrell/)
- [Marcin Zduniak](https://www.linkedin.com/in/marcinzduniak/)
- [Sayantan Modal](https://www.linkedin.com/in/sayantan-mondal-1693101b4/)
- [Yusuff Jamal](https://www.linkedin.com/in/jamal-yusuff-1a4aa1212/)
- [Glwadys Fayolle](https://www.linkedin.com/in/glwadysfayolle/)
- [Peter Akech](https://www.linkedin.com/in/peter-akech-2a777417/)

## Pitch Deck

Check out our [Pitch Deck](https://docs.google.com/presentation/d/1noBhUjozHX6jM7-iJRwNcAG4YPRead07lQuHpTORFDc/edit) for detailed information about our project, goals, and current fundraising round.
