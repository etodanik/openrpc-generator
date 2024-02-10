# OpenRPC Client Generator

Generates JSON-RPC 2.0 clients from OpenRPC schema files.

## Current State

The repository is currently a proof of concept. _It is not yet production ready_
but any issue or feature suggestion is welcome.

It currently produces a client that fully compiles under Unreal Engine 5.3.2 for
`petstore-openrpc.json`.

## Features

- [x] HTTP Transport
- [x] Works for Petstore
- [ ] Test with all built in OpenRPC Examples
- [ ] Generalize HTTP Transport
- [ ] Allow custom URLs
- [ ] Webstorm Transport
