#!/bin/bash

rm $(pwd)/target/deploy/sky_trade_land_token_program-keypair.json

anchor build

anchor keys sync

anchor build

anchor deploy

yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/sky_trade_land_token_program.ts