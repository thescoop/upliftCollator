#!/usr/bin/env bash
# Create or update the conda environment for the uplift narrator.
# Run from the narrate/ folder.
set -euo pipefail

ENV_NAME="uplift-narrate"
PY_VERSION="3.11"

cd "$(dirname "$0")"

source "$(conda info --base)/etc/profile.d/conda.sh"

if conda env list | awk '{print $1}' | grep -qx "$ENV_NAME"; then
    echo "Updating existing conda env '$ENV_NAME'..."
    conda activate "$ENV_NAME"
else
    echo "Creating conda env '$ENV_NAME' (python $PY_VERSION)..."
    # conda-forge avoids the Anaconda main-channel ToS gate.
    conda create -y -n "$ENV_NAME" -c conda-forge --override-channels "python=$PY_VERSION"
    conda activate "$ENV_NAME"
fi

pip install -r requirements.txt

echo
echo "Done. Activate with:  conda activate $ENV_NAME"
echo "Or use ./_run.sh which activates automatically."
