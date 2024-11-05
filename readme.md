# Safe Multisig Owner replacer

Build a transaction to optimally change the owners of a Safe Multisigs to match a given list.

## Requirements

- [Deno](https://deno.com/).

## Usage

> [!TIP]
> This repository can be run in a devcontainer directly from within github without the need for a local setup.

The file `./config.ts` specifies all safes to consider, and, for each:
- the network they live in,
- the list of new owners, and
- the new threshold.

The script generates a transaction file for each Safe.
You can use the transaction builder on the Safe interface to simulate and execute the resulting transaction.

Generate the transaction files with:

```sh
./run.sh
```

The resulting output can be found in `./out`.

## Limitations

See `./src/networks.ts` for a full list of supported networks.
