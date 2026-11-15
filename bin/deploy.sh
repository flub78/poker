#!/usr/bin/env bash
# Déploie l'application (dossier web/) avec rsync, en datant les fichiers pour le cache.
#
# index.html charge css/style.css?v=… et js/app.js?v=… : le script remplace ce numéro par le
# commit courant (suivi de « -modifie » s'il y a des changements non commités), dans une copie.
# Les navigateurs rechargent ainsi la nouvelle version, sans numéro à augmenter à la main.
#
# Usage : bin/deploy.sh <destination rsync> [options rsync]
#   bin/deploy.sh utilisateur@vps:/chemin/public_html/poker/
#   bin/deploy.sh utilisateur@vps:/chemin/public_html/poker/ --dry-run     (simulation)
#
# Cache côté serveur (flub78.net : nginx devant Apache ; nginx sert lui-même les fichiers).
# Le ?v= ne couvre que app.js et style.css ; les modules chargés par import n'ont pas de numéro.
# Sans règle, nginx envoie « expires max » (10 ans) et les navigateurs gardent l'ancienne
# version. À mettre dans le bloc server HTTPS, avant les autres location (ou dans le fichier
# d'inclusion personnalisé du panneau d'administration), puis nginx -t && systemctl reload nginx :
#
#   location ^~ /poker/ {
#       index index.html;
#       location ~* \.(?:html|js|mjs|css|json|csv|md)$ {
#           expires epoch;      # Cache-Control: no-cache, revalidation par etag
#       }
#       location ~* \.(?:png|jpe?g|svg|webp|gif|ico|woff2?)$ {
#           expires 7d;
#       }
#   }
#
# Vérifier : curl -sI https://flub78.net/poker/simulateur/simulateur.js | grep -i cache-control
# (attendu : no-cache). « expires » plutôt que add_header, qui annulerait les en-têtes du parent (HSTS).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ $# -lt 1 ]]; then
    sed -n '2,10p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    exit 1
fi
DEST="$1"
shift

VERSION="$(git -C "$ROOT" rev-parse --short HEAD)"
if [[ -n "$(git -C "$ROOT" status --porcelain -- web)" ]]; then
    VERSION="$VERSION-modifie"
    echo "Attention : web/ contient des changements non commités (version $VERSION)." >&2
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -a "$ROOT/web/." "$TMP/"
sed -i -E "s/\?v=[A-Za-z0-9.-]+\"/?v=$VERSION\"/g" "$TMP/index.html"
grep -q "?v=$VERSION\"" "$TMP/index.html" || { echo "Erreur : aucun ?v= remplacé dans index.html." >&2; exit 1; }

echo "Version $VERSION → $DEST"
rsync -av --delete "$@" "$TMP/" "$DEST"
