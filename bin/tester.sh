#!/usr/bin/env bash
# Lance tous les tests automatiques du projet.
#   1. tests unitaires (node --test) : modules JavaScript purs, dans tests/ ;
#   2. partie de contrôle des bots (tools/controle_bots.mjs) : aucun niveau ne perd contre le
#      précédent (environ 20 s) ;
#   3. test de fumée (tools/verifier_web.mjs) : toutes les pages dans Chrome headless.
#
# Usage : bin/tester.sh            les trois
#         bin/tester.sh --rapide   tests unitaires seulement (quelques secondes)
# Code de sortie non nul au premier échec.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "== Tests unitaires"
node --test --test-reporter=dot 'tests/**/*.test.js'

if [[ "${1:-}" == "--rapide" ]]; then
    exit 0
fi

echo "== Partie de contrôle des bots"
node tools/controle_bots.mjs

echo "== Test de fumée"
node tools/verifier_web.mjs
