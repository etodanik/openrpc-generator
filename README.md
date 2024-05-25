# OpenRPC Client Generator

Generates JSON-RPC 2.0 clients from OpenRPC schema files.

## Cutting Edge

This repository is targeting Unreal Engine 5.4.x and newer as a conscious choice. Unreal 5.4.0 brought support for `TOptional` in UHT which
makes life much easier when dealing with RPC endpoints that have tons of optional parameters and return values. If you have a real need for
supporting older versions of Unreal please open an issue and your use case will be considered.

## Current State

The repository is currently a proof of concept. _It is not yet production ready_ but any issue or feature suggestion is welcome.

It currently produces a client that fully compiles under Unreal Engine 5.4.0 for `petstore-openrpc.json`.

## Features

- [x] HTTP Transport
- [x] Works for Petstore
- [ ] Test with all built in OpenRPC Examples
- [ ] Generalize HTTP Transport
- [ ] Allow custom URLs
- [ ] Webstorm Transport

## Implemented Solana RPC methods

The following are the most popular methods sorted by popularity.

- [x] getAccountInfo
- [ ] getMultipleAccounts
- [x] getLatestBlockhash
- [ ] getTransaction
- [ ] simulateTransaction
- [ ] getTokenAccountBalance
- [x] sendTransaction
- [ ] getTokenAccountsByOwner
- [ ] getTokenLargeAccounts
- [ ] getBlock
- [ ] getSignatureStatuses
- [ ] getHealth
- [ ] getProgramAccounts
- [ ] getRecentPrioritizationFees
- [ ] getBalance
- [ ] getBlockheight

In addition the following are implemented:

- [x] getMinimumBalanceForRentExemption
