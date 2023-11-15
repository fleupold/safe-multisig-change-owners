#!/bin/bash

set -o errexit -o nounset -o pipefail

base_path="$(dirname "$(realpath -s "$0")")/src"
deno run \
  --allow-write="./out" \
  --allow-net="\
rpc.mevblocker.io,\
rpc.gnosischain.com,\
ethereum-sepolia.publicnode.com" \
  -- \
  "$base_path/replace-owners.ts" \
  "$@"
