#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVS=(dev staging prod)
TMP_PLAN_ROOT=""

cleanup() {
  if [[ -n "${TMP_PLAN_ROOT:-}" && -d "${TMP_PLAN_ROOT:-}" ]]; then
    rm -rf "$TMP_PLAN_ROOT"
  fi
}

tf() {
  local configured_region
  local -a env_args

  configured_region="$(aws configure get region 2>/dev/null || true)"
  env_args=("AWS_SDK_LOAD_CONFIG=1")

  if [[ -n "${AWS_PROFILE:-}" ]]; then
    env_args+=("AWS_PROFILE=${AWS_PROFILE}")
  fi

  if [[ -n "${AWS_REGION:-}" ]]; then
    env_args+=("AWS_REGION=${AWS_REGION}")
  elif [[ -n "${AWS_DEFAULT_REGION:-}" ]]; then
    env_args+=("AWS_REGION=${AWS_DEFAULT_REGION}")
  elif [[ -n "$configured_region" ]]; then
    env_args+=("AWS_REGION=${configured_region}")
  fi

  env "${env_args[@]}" terraform "$@"
}

usage() {
  cat <<'EOF'
Usage:
  ./tf-all.sh fmt
  ./tf-all.sh validate
  ./tf-all.sh plan

Behavior:
  fmt      Runs terraform fmt recursively from terraform/.
  validate Runs init -backend=false -reconfigure and validate in dev/staging/prod.
  plan     Runs init -backend=false -reconfigure and plan -lock=false in dev/staging/prod.
EOF
}

run_fmt() {
  echo "==> terraform fmt -recursive"
  tf -chdir="$ROOT_DIR" fmt -recursive
}

run_validate() {
  for env in "${ENVS[@]}"; do
    echo "==> [$env] terraform init -backend=false -reconfigure"
    tf -chdir="$ROOT_DIR/envs/$env" init -backend=false -reconfigure -input=false

    echo "==> [$env] terraform validate"
    tf -chdir="$ROOT_DIR/envs/$env" validate
  done
}

run_plan() {
  local rc

  TMP_PLAN_ROOT="$(mktemp -d /tmp/parcel-tf-plan-XXXXXX)"
  trap cleanup EXIT

  cp -r "$ROOT_DIR"/* "$TMP_PLAN_ROOT"/
  rm -f "$TMP_PLAN_ROOT"/envs/dev/backend.tf "$TMP_PLAN_ROOT"/envs/staging/backend.tf "$TMP_PLAN_ROOT"/envs/prod/backend.tf

  echo "INFO: using temporary backend-free workspace at: $TMP_PLAN_ROOT"

  for env in "${ENVS[@]}"; do
    echo "==> [$env] terraform init -backend=false -reconfigure"
    tf -chdir="$TMP_PLAN_ROOT/envs/$env" init -backend=false -reconfigure -input=false

    echo "==> [$env] terraform plan"
    set +e
    tf -chdir="$TMP_PLAN_ROOT/envs/$env" plan -input=false -lock=false -refresh=true -detailed-exitcode
    rc=$?
    set -e

    if [[ $rc -eq 1 ]]; then
      echo "ERROR: plan failed for environment: $env"
      exit 1
    elif [[ $rc -eq 2 ]]; then
      echo "INFO: plan succeeded with pending changes for environment: $env"
    else
      echo "INFO: plan succeeded with no changes for environment: $env"
    fi
  done
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  fmt)
    run_fmt
    ;;
  validate)
    run_validate
    ;;
  plan)
    run_plan
    ;;
  *)
    usage
    exit 1
    ;;
esac
