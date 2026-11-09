"""Version HTML du tutoriel, pour l'onglet « Cours » de l'application (web/).

Source : l'export HTML (format `html`) du Claude Doc « Initiation au poker — programme progressif ».
Le script découpe le document en pages :

    accueil (titre + table des matières), introduction, mode d'emploi,
    niveau-1 … niveau-6, puis les annexes grille, ressources, glossaire

et écrit :
    web/cours/contenu.js   les pages (module ES : export default { title, byline, pages })
    web/cours/img/         les illustrations (copiées depuis doc/figures et doc/images)

Il remplace aussi ce que l'export ne sait pas rendre hors de Claude Docs :
- les images (blob/…) par les fichiers locaux (table BLOBS ci-dessous) ;
- le graphique « escalier » des six niveaux (widget du doc) par une figure HTML ;
- les liens internes du doc (#<id de bloc>) par l'adresse de la section dans le cours ;
- la mention de l'auteur, les listes déroulantes (statut de la grille), la date.
La photo d'ouverture de l'introduction passe sur l'accueil du cours (champ cover).
Les symboles ♥ ♦ sont colorés en rouge, ♠ ♣ en noir.

Usage : python3 tools/cours_html.py export.html
"""
import html
import json
import re
import shutil
import sys
import unicodedata
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "web" / "cours"
AUTHOR = "Frédéric Peignot"

# Images du doc (id de blob) → fichier local. Une image nouvelle dans le doc doit être ajoutée ici.
BLOBS = {
    "534de084-70ba": "doc/images/mallette-poker.jpg",
    "da974040-16a6": "doc/figures/fig-main-complete.png",
    "d207e48a-20be": "doc/figures/fig-classement.png",
    "4e1bb97d-ae22": "doc/figures/fig-nuts.png",
    "d9bf37ed-115c": "doc/figures/fig-mains-depart.png",
    "9ada2409-d5a1": "doc/figures/fig-outs.png",
    "1f8f621f-8b6b": "doc/figures/fig-duels.png",
    "f653b3c8-4dfa": "doc/figures/fig-textures.png",
    "3d3e87a9-2b50": "doc/figures/fig-range.png",
}

# Graphique « Six niveaux, chacun ouvert par un test de passage » (widget du doc, absent de l'export).
STAIRS = [
    ("Niveau 1 · Les règles", "Jouer une main complète sans aide", "1 semaine",
     "main complète, 10 mains classées, nuts 18 sur 20"),
    ("Niveau 2 · Anti-erreurs", "Jouer serré et agressif avant le flop", "2 à 3 semaines",
     "VPIP 18 à 26 % sur 500 mains, aucun limp"),
    ("Niveau 3 · Probabilités", "Savoir en 10 secondes si un call est rentable", "3 à 4 semaines",
     "18 décisions call ou fold sur 20, en 10 s chacune"),
    ("Niveau 4 · Après le flop", "Chaque mise a une raison : valeur ou bluff", "1 à 2 mois",
     "5 000 mains au moins à l'équilibre"),
    ("Niveau 5 · Ranges et adaptation", "Raisonner sur l'éventail adverse, exploiter", "2 à 3 mois",
     "ranges décrites, bankroll et limite de perte tenues"),
    ("Niveau 6 · Vers le GTO", "S'entraîner au solveur, puis exploiter", "continu", None),
]

# Grandes parties (titres h2) → page. Les annexes sont marquées pour la table des matières.
PAGES = [
    (r"Introduction", "introduction", "Introduction", False),
    (r"Mode d'emploi", "mode-d-emploi", "Mode d'emploi", False),
    (r"Niveau 1\b", "niveau-1", None, False),
    (r"Niveau 2\b", "niveau-2", None, False),
    (r"Niveau 3\b", "niveau-3", None, False),
    (r"Niveau 4\b", "niveau-4", None, False),
    (r"Niveau 5\b", "niveau-5", None, False),
    (r"Niveau 6\b", "niveau-6", None, False),
    (r"Grille d'auto-évaluation", "grille", None, True),
    (r"Ressources d'entraînement", "ressources", None, True),
    (r"Glossaire", "glossaire", None, True),
]

MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
          "septembre", "octobre", "novembre", "décembre"]


def slug(text):
    text = unicodedata.normalize("NFKD", html.unescape(text)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def plain(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def color_suits(fragment):
    """Colore les symboles de couleur dans le texte, jamais dans les attributs (alt…)."""
    def repl(m):
        text = m.group(1)
        # U+FE0E : affichage en texte, pas en émoji (certaines polices dessinent ♠ ♥ en émoji)
        text = re.sub(r"([♥♦])\uFE0E?", "<span class=\"suit red\">\\1\uFE0E</span>", text)
        text = re.sub(r"([♠♣])\uFE0E?", "<span class=\"suit black\">\\1\uFE0E</span>", text)
        return ">" + text + "<"
    return re.sub(r">([^<]+)<", repl, fragment)


def image_size(path):
    """(largeur, hauteur) d'un PNG ou d'un JPEG, lue dans l'en-tête du fichier."""
    data = Path(path).read_bytes()
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")
    i = 2
    while i < len(data):
        marker, length = data[i + 1], int.from_bytes(data[i + 2:i + 4], "big")
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            return int.from_bytes(data[i + 7:i + 9], "big"), int.from_bytes(data[i + 5:i + 7], "big")
        i += 2 + length
    sys.exit(f"Erreur : taille de {path} illisible.")


def stairs_html():
    items = []
    for title, goal, duration, test in STAIRS:
        items.append(
            f'<li><div class="stair"><div class="stair-head"><strong>{html.escape(title)}</strong>'
            f'<span class="stair-time">{html.escape(duration)}</span></div>'
            f'<div>{html.escape(goal)}</div></div>'
            + (f'<p class="stair-test">Test : {html.escape(test)}</p>' if test else "") + "</li>")
    return ('<figure class="stairs"><p class="stairs-title">Six niveaux, chacun ouvert par un test de passage</p>'
            f'<ol>{"".join(items)}</ol>'
            '<figcaption>Progression : 6 niveaux, 5 tests de passage</figcaption></figure>')


def main(src):
    doc = Path(src).read_text(encoding="utf-8")

    # --- en-tête : titre et ligne de date ---
    title = plain(re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S).group(1))
    m = re.search(r'<time[^>]*datetime="(\d{4})-(\d{2})-(\d{2})"', doc)
    updated = date(int(m.group(1)), int(m.group(2)), int(m.group(3))) if m else None
    byline = AUTHOR + (f" · mis à jour le {updated.day} {MONTHS[updated.month - 1]} {updated.year}" if updated else "")

    # --- découpage par h2 ---
    parts = re.split(r"(?=<h2[ >])", doc)
    sections = parts[1:]
    if len(sections) != len(PAGES):
        sys.exit(f"Erreur : {len(sections)} grandes parties dans l'export, {len(PAGES)} attendues (PAGES).")

    pages = []
    used_blobs = set()
    for body, (pattern, pid, short, annex) in zip(sections, PAGES):
        h2 = plain(re.match(r"<h2[^>]*>(.*?)</h2>", body, re.S).group(1))
        if not re.match(pattern, h2):
            sys.exit(f"Erreur : partie « {h2} » trouvée, « {pattern} » attendue.")
        body = re.sub(r"^<h2[^>]*>.*?</h2>\s*", "", body, flags=re.S)

        # sous-titres h3 : identifiants sans accents, pour l'adresse #cours/<page>/<section>
        subs = []

        def h3(m):
            text = plain(m.group(1))
            sid = slug(text)
            subs.append({"id": sid, "title": text})
            return f'<h3 id="{sid}">{m.group(1)}</h3>'
        body = re.sub(r"<h3[^>]*>(.*?)</h3>", h3, body, flags=re.S)

        pages.append({"id": pid, "title": h2, "short": short or h2.split(" — ")[0],
                      "subtitle": h2.split(" — ")[1] if " — " in h2 else None,
                      "annex": annex, "sections": subs, "html": body})

    # index des sections, pour résoudre les liens internes par leur texte (« C3.7 »)
    index = {}
    for p in pages:
        for s in p["sections"]:
            code = s["title"].split(" ")[0]
            index[code] = f"#cours/{p['id']}/{s['id']}"
            index[s["title"]] = index[code]

    for p in pages:
        body = p["html"]

        def link(m):
            attrs, text = m.group(1), m.group(2)
            href = re.search(r'href="([^"]*)"', attrs).group(1)
            if href.startswith("#"):
                target = index.get(plain(text))
                if not target:
                    sys.exit(f"Erreur : lien interne « {plain(text)} » ({href}) sans section correspondante.")
                return f'<a href="{target}">{text}</a>'
            return f'<a href="{href}" target="_blank" rel="noopener">{text}</a>'
        body = re.sub(r"<a ([^>]*)>(.*?)</a>", link, body, flags=re.S)

        def img(m):
            blob, alt = m.group(1), m.group(2)
            if blob not in BLOBS:
                sys.exit(f"Erreur : image blob/{blob} inconnue ({html.unescape(alt)}) ; ajoutez-la à BLOBS.")
            used_blobs.add(blob)
            name = Path(BLOBS[blob]).name
            w, h = image_size(ROOT / BLOBS[blob])
            return f'<img src="cours/img/{name}" alt="{alt}" width="{w}" height="{h}" loading="lazy">'
        body = re.sub(r'<img src="blob/([^"]+)" alt="([^"]*)">', img, body)
        body = re.sub(r"<p>(<img [^>]*>)</p>", r'<figure class="figure">\1</figure>', body)

        body = re.sub(r'<figure data-embed="[^"]*">.*?</figure>', lambda _: stairs_html(), body, flags=re.S)
        body = re.sub(r'<span data-atom="enum"[^>]*>(.*?)</span>', r'<span class="chip">\1</span>', body)
        body = re.sub(r'<span data-atom="mention"[^>]*>.*?</span>', AUTHOR, body)
        body = re.sub(r"<table>", '<div class="table-wrap"><table>', body)
        body = re.sub(r"</table>", "</table></div>", body)
        p["html"] = color_suits(body).strip()

    # La photo d'ouverture (et son crédit) va sur l'accueil, comme en page 1 du PDF.
    intro = pages[0]
    m = re.search(r'<figure class="figure">.*?</figure>\s*(?:<p><em>Photo[^<]*</em></p>)?', intro["html"], re.S)
    cover = m.group(0) if m else ""
    if m:
        intro["html"] = (intro["html"][:m.start()] + intro["html"][m.end():]).strip()
        cover = cover.replace(' loading="lazy"', "").replace("<p><em>", '<p class="cover-credit"><em>')

    missing = [b for b in BLOBS if b not in used_blobs]
    if missing:
        print(f"Attention : images de BLOBS absentes du doc : {', '.join(missing)}")

    # --- sortie ---
    img_dir = OUT_DIR / "img"
    if img_dir.exists():
        shutil.rmtree(img_dir)
    img_dir.mkdir(parents=True)
    for b in used_blobs:
        shutil.copy2(ROOT / BLOBS[b], img_dir / Path(BLOBS[b]).name)

    data = {"title": title, "byline": byline, "cover": cover, "pages": pages}
    js = ("// Fichier généré par tools/cours_html.py à partir de l'export HTML du Claude Doc.\n"
          "// Ne pas modifier à la main : modifier le doc, réexporter, relancer le script.\n"
          "export default " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    (OUT_DIR / "contenu.js").write_text(js, encoding="utf-8")
    print(f"{len(pages)} pages, {sum(len(p['sections']) for p in pages)} sections, "
          f"{len(used_blobs)} images → {OUT_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
