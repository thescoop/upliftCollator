#!/usr/bin/env bash
# Activate the conda env and run the narrator.
# Usage: ./_run.sh path/to/case.pdf [--out-dir DIR]
set -euo pipefail

ENV_NAME="uplift-narrate"

cd "$(dirname "$0")"

source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate "$ENV_NAME"

python narrate.py "$@"
