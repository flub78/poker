#!/usr/bin/env bash
# Lance un serveur HTTP statique à la racine du dépôt et affiche
# les URLs des tests de passage de chaque niveau (tests/niveau-*).
#
# Usage : bin/serve.sh [port]
#   PORT=8000  port d'écoute (ou 1er argument)
#   HOST=127.0.0.1  adresse d'écoute ; HOST=0.0.0.0 pour l'ouvrir au réseau local

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${1:-${PORT:-8000}}"
HOST="${HOST:-127.0.0.1}"

if ! command -v python3 >/dev/null 2>&1; then
    echo "Erreur : python3 est requis." >&2
    exit 1
fi

if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "Erreur : port invalide « $PORT »." >&2
    exit 1
fi

# Vérifie que le port est libre
if python3 -c "import socket,sys; s=socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); s.bind(('$HOST', $PORT))" 2>/dev/null; then
    :
else
    echo "Erreur : le port $PORT est déjà utilisé. Essayez : bin/serve.sh $((PORT + 1))" >&2
    exit 1
fi

# Adresses à afficher
hosts=()
if [[ "$HOST" == "0.0.0.0" ]]; then
    hosts+=("localhost")
    for ip in $(hostname -I 2>/dev/null); do
        [[ "$ip" == *:* ]] || hosts+=("$ip")
    done
elif [[ "$HOST" == "127.0.0.1" ]]; then
    hosts+=("localhost")
else
    hosts+=("$HOST")
fi

echo "Serveur : $ROOT"
echo
echo "Tests de passage :"
found=0
for dir in "$ROOT"/tests/niveau-*/; do
    [[ -f "$dir/index.html" ]] || continue
    found=1
    name="$(basename "$dir")"
    label="Niveau ${name#niveau-}"
    for h in "${hosts[@]}"; do
        printf '  %-10s http://%s:%s/tests/%s/\n' "$label" "$h" "$PORT" "$name"
        label=""
    done
done
if [[ $found -eq 0 ]]; then
    echo "  (aucun test trouvé dans tests/niveau-*)"
fi
echo
echo "Ctrl+C pour arrêter."
echo

cd "$ROOT"
exec python3 -m http.server "$PORT" --bind "$HOST"
