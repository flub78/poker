"""Décode un export de Claude Doc enregistré par Claude Code dans un fichier de résultat d'outil.

Quand un export (outil `export` des Claude Docs) est trop gros pour la conversation, Claude Code
l'enregistre dans un fichier JSON : [{type, text}, …], dont un élément contient
{"data": {"bytes_b64": …}}. Ce script écrit le fichier exporté (HTML, PDF, Markdown…) en clair.

Usage : python3 tools/decoder_export.py <fichier de résultat> <fichier de sortie>
"""
import base64
import json
import sys


def main(src, dst):
    items = json.load(open(src, encoding="utf-8"))
    for item in items if isinstance(items, list) else [items]:
        text = item.get("text", "") if isinstance(item, dict) else ""
        try:
            data = json.loads(text).get("data", {})
        except (ValueError, AttributeError):
            continue
        if "bytes_b64" in data:
            raw = base64.b64decode(data["bytes_b64"])
            open(dst, "wb").write(raw)
            print(f"{data.get('name', '?')} : {len(raw)} octets → {dst}")
            return
    sys.exit("Erreur : aucun contenu exporté (bytes_b64) dans ce fichier.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
