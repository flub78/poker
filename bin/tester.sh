#!/usr/bin/env bash
# Lance tous les tests automatiques du projet.
#   1. tests unitaires (node --test) : modules JavaScript purs, dans tests/ ;
#   2. test de fumée (tools/verifier_web.mjs) : toutes les pages dans Chrome headless.
#
# Usage : bin/tester.sh            les deux
#         bin/tester.sh --rapide   tests unitaires seulement (quelques secondes)
# Code de sortie non nul au premier échec.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "== Tests unitaires"
node --test --test-reporter=dot 'tests/**/*.test.js'

if [[ "${1:-}" == "--rapide" ]]; then
    exit 0
fi

echo "== Test de fumée"
node tools/verifier_web.mjs
