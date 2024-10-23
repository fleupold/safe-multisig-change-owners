#!/bin/bash

set -o errexit -o nounset -o pipefail

base_path="$(dirname "$(realpath -s "$0")")/src"

# Explanation for the flags:
# - `NODE_EXTRA_CA_CERTS`: if using ethers npm package and this is denied, the
#   script errors out with "Error: could not detect network".
# - `--deny-read`: do not prompt for permission to read the node_modules cache,
#   which is triggered by the npm module import of ethers.
# - `--allow-net=...`: list of nodes that the script is expected to connect to.
# - `--allow-write=./out`: this is the folder that collects the script's output.
deno run \
  --deny-read \
  --allow-write="./out" \
  --allow-env='NODE_EXTRA_CA_CERTS' \
  --allow-net="\
rpc.mevblocker.io,\
rpc.gnosischain.com,\
ethereum-sepolia.publicnode.com,\
arbitrum-one-rpc.publicnode.com" \
  -- \
  "$base_path/replace-owners.ts" \
  "$@"
