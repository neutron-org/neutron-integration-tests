# Smart contracts for Neutron integration tests

This folder contains test contracts and auxiliary gizmos for building them.

## Contracts

The contracts folder is the place where the test contracts are located. Here is a `cargo workspace` created for the contracts. To add a new contract, don't forget to modify the `Cargo.toml` file in this directory. To build them, use the corresponding Makefile command:

```sh
make build
```

The result wasm files are placed in the `artifacts` folder here.