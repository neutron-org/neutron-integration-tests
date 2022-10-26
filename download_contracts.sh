#!/usr/bin/env bash

# http://redsymbol.net/articles/unofficial-bash-strict-mode/
set -euo pipefail
IFS=$'\n\t'

REPO_BASE="https://github.com/neutron-org/neutron-contracts"

contract_link() {
  local branch
  local contract_name
  branch="$1"
  contract_name="$2"
  echo -n "$REPO_BASE/raw/$branch/artifacts/$contract_name.wasm"
}

select_branch() {
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$(curl -m 10 -s -o /dev/null -w "%{http_code}" "$REPO_BASE/tree/$branch")" != "200" ]]; then
    branch="main"
  fi
  echo -n "$branch"
}

main() {
  declare -a contracts=(
    "ibc_transfer"
    "neutron_interchain_queries"
    "neutron_interchain_txs"
    "reflect"
  )
  local branch
  if [ -z ${1+x} ]; then
    branch="$(select_branch)"
  else
    branch="$1"
  fi
  echo "Using branch $branch"

  for contract in "${contracts[@]}"; do
    local url
    url="$(contract_link "$branch" "$contract")"
    echo -n "Downloading contract: $contract.wasm… "
    curl -m 20 -L --silent --show-error "$url" > "contracts/artifacts/$contract.wasm"
    echo "done."
  done
}

main "$@"
