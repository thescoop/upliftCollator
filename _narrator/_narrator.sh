#!/usr/bin/env bash
# _narrator.sh - Launch the Uplift Narrator GUI from WSL/Linux.
# Usage:  ./_narrator.sh [path/to/case.docx]   (legacy .pdf also accepted)
# Requires WSLg (Windows 11) or an X server for the GUI to display.
set -euo pipefail

cd "$(dirname "$0")"

source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate uplift-narrate

python narrate_gui.py "$@"
