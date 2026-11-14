#!/usr/bin/env bash
# Installe la banque des Réflexes exportée par mentor (archive ZIP au format d'échange des banques :
# questions.csv, images/, banque.json) dans web/reflexes/banque/, à la place de l'ancienne,
# puis lance les tests unitaires (lecture de toute la banque, images présentes).
#
# Usage : bin/installer-banque.sh export-mentor.zip
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

zip="${1:?Usage : bin/installer-banque.sh export-mentor.zip}"
[[ -f "$zip" ]] || { echo "Fichier introuvable : $zip" >&2; exit 1; }
grep -qx 'questions.csv' <<< "$(unzip -Z1 "$zip")" || { echo "Pas de questions.csv à la racine de $zip" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
unzip -q "$zip" -d "$tmp"
rm -rf web/reflexes/banque
mkdir -p web/reflexes/banque
cp -r "$tmp"/questions.csv web/reflexes/banque/
[[ -f "$tmp/banque.json" ]] && cp "$tmp/banque.json" web/reflexes/banque/
[[ -d "$tmp/images" ]] && cp -r "$tmp/images" web/reflexes/banque/
echo "Banque installée : $(($(wc -l < web/reflexes/banque/questions.csv) - 1)) lignes, $(ls web/reflexes/banque/images 2>/dev/null | wc -l) images."

bin/tester.sh --rapide
