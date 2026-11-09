"""Publie un Claude Doc sous forme de site à pages : le « Cours » de l'application (web/).

Source : l'export HTML (format `html`) du doc. Tout ce qui est propre au doc est dans un fichier
de configuration JSON (par défaut tools/cours_config.json) :

    auteur          nom affiché à la place de la mention de l'auteur
    sortie          dossier écrit : <sortie>/contenu.js et <sortie>/img/
    chemin_images   chemin des images vu depuis la page web
    images          id de blob du doc → fichier local (une image nouvelle doit y être ajoutée)
    pages           une entrée par titre de niveau 2, dans l'ordre :
                    { titre (expression régulière), id, court?, annexe? }
    couverture      { page, credit } : la première image de cette page, et le paragraphe
                    en italique qui commence par `credit`, vont sur l'accueil
    escaliers       tableaux à dessiner en escalier : { titre, prefixe, legende }. Le tableau
                    suit un paragraphe en gras égal à `titre` ; colonnes : étape, objectif,
                    durée, test pour passer à l'étape suivante.

Le script remplace aussi ce que l'export ne sait pas rendre hors de Claude Docs :
- les liens internes du doc (#<id de bloc>), résolus par le texte du lien (« C3.7 ») ;
- la mention de l'auteur, les listes déroulantes (statut de la grille), la date.
Les symboles ♥ ♦ sont colorés en rouge, ♠ ♣ en noir, toujours affichés en texte (jamais en émoji).

Usage : python3 tools/cours_html.py export.html [config.json]
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
MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
          "septembre", "octobre", "novembre", "décembre"]


def slug(text):
    text = unicodedata.normalize("NFKD", html.unescape(text)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def plain(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def color_suits(fragment):
    """Colore les symboles de couleur dans le texte, jamais dans les attributs (alt…).
    Le doc contient parfois U+FE0F (« afficher en émoji ») : on le remplace par U+FE0E (« en texte »)."""
    def repl(m):
        text = m.group(1).replace("️", "")
        text = re.sub(r"([♥♦])︎?", "<span class=\"suit red\">\\1︎</span>", text)
        text = re.sub(r"([♠♣])︎?", "<span class=\"suit black\">\\1︎</span>", text)
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


def stairs(body, spec):
    """Remplace le tableau qui suit le titre `spec['titre']` par une figure en escalier."""
    m = None
    for t in re.finditer(r"<p><strong>([^<]*)</strong></p>\s*<div class=\"table-wrap\"><table>.*?<tbody>(.*?)</tbody></table></div>",
                         body, re.S):
        if plain(t.group(1)) == spec["titre"]:
            m = t
            break
    if not m:
        return body, False
    items = []
    for row in re.findall(r"<tr>(.*?)</tr>", m.group(2), re.S):
        cells = [c.strip() for c in re.findall(r"<td>(.*?)</td>", row, re.S)]
        step, goal, duration, test = (cells + ["", "", "", ""])[:4]
        has_test = plain(test) not in ("", "—", "-")
        items.append(
            f'<li><div class="stair"><div class="stair-head"><strong>{spec.get("prefixe", "")}{step}</strong>'
            f'<span class="stair-time">{duration}</span></div><div>{goal}</div></div>'
            # « Main complète » → « main complète », mais « VPIP » reste en majuscules
            + (f'<p class="stair-test">Test : {test[0].lower() + test[1:] if test[1:2].islower() else test}</p>'
               if has_test else "")
            + "</li>")
    figure = (f'<figure class="stairs"><p class="stairs-title">{html.escape(spec["titre"])}</p>'
              f'<ol>{"".join(items)}</ol>'
              + (f'<figcaption>{html.escape(spec["legende"])}</figcaption>' if spec.get("legende") else "")
              + "</figure>")
    return body[:m.start()] + figure + body[m.end():], True


def main(src, config_path):
    cfg = json.loads(Path(config_path).read_text(encoding="utf-8"))
    out_dir = ROOT / cfg["sortie"]
    author = cfg.get("auteur", "")
    blobs = cfg.get("images", {})
    doc = Path(src).read_text(encoding="utf-8")

    # --- en-tête : titre et ligne de date ---
    title = plain(re.search(r"<h1[^>]*>(.*?)</h1>", doc, re.S).group(1))
    m = re.search(r'<time[^>]*datetime="(\d{4})-(\d{2})-(\d{2})"', doc)
    updated = date(int(m.group(1)), int(m.group(2)), int(m.group(3))) if m else None
    byline = author + (f" · mis à jour le {updated.day} {MONTHS[updated.month - 1]} {updated.year}" if updated else "")

    # --- découpage par h2 ---
    sections = re.split(r"(?=<h2[ >])", doc)[1:]
    specs = cfg["pages"]
    if len(sections) != len(specs):
        found = ", ".join(plain(re.match(r"<h2[^>]*>(.*?)</h2>", s, re.S).group(1)) for s in sections)
        sys.exit(f"Erreur : {len(sections)} grandes parties dans l'export ({found}), {len(specs)} attendues (pages).")

    pages = []
    for body, spec in zip(sections, specs):
        h2 = plain(re.match(r"<h2[^>]*>(.*?)</h2>", body, re.S).group(1))
        if not re.match(spec["titre"], h2):
            sys.exit(f"Erreur : partie « {h2} » trouvée, « {spec['titre']} » attendue.")
        body = re.sub(r"^<h2[^>]*>.*?</h2>\s*", "", body, flags=re.S)

        # sous-titres h3 : identifiants sans accents, pour l'adresse #cours/<page>/<section>
        subs = []

        def h3(m):
            text = plain(m.group(1))
            subs.append({"id": slug(text), "title": text})
            return f'<h3 id="{slug(text)}">{m.group(1)}</h3>'
        body = re.sub(r"<h3[^>]*>(.*?)</h3>", h3, body, flags=re.S)

        pages.append({"id": spec["id"], "title": h2, "short": spec.get("court") or h2.split(" — ")[0],
                      "subtitle": h2.split(" — ")[1] if " — " in h2 else None,
                      "annex": bool(spec.get("annexe")), "sections": subs, "html": body})

    # index des sections, pour résoudre les liens internes par leur texte (« C3.7 »)
    index = {}
    for p in pages:
        for s in p["sections"]:
            index[s["title"].split(" ")[0]] = index[s["title"]] = f"#cours/{p['id']}/{s['id']}"

    used_blobs = set()
    stairs_done = set()
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
            if blob not in blobs:
                sys.exit(f"Erreur : image blob/{blob} inconnue ({html.unescape(alt)}) ; ajoutez-la à « images ».")
            used_blobs.add(blob)
            w, h = image_size(ROOT / blobs[blob])
            return (f'<img src="{cfg["chemin_images"]}/{Path(blobs[blob]).name}" alt="{alt}" '
                    f'width="{w}" height="{h}" loading="lazy">')
        body = re.sub(r'<img src="blob/([^"]+)" alt="([^"]*)">', img, body)
        body = re.sub(r"<p>(<img [^>]*>)</p>", r'<figure class="figure">\1</figure>', body)

        if re.search(r"<figure data-embed=", body):
            print(f"Attention : graphique du doc non exportable dans « {p['title']} », retiré. "
                  "Le remplacer dans le doc par un tableau (voir « escaliers »).")
            body = re.sub(r'<figure data-embed="[^"]*">.*?</figure>', "", body, flags=re.S)
        body = re.sub(r'<span data-atom="enum"[^>]*>(.*?)</span>', r'<span class="chip">\1</span>', body)
        body = re.sub(r'<span data-atom="mention"[^>]*>.*?</span>', author, body)
        body = body.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
        for spec in cfg.get("escaliers", []):
            body, done = stairs(body, spec)
            if done:
                stairs_done.add(spec["titre"])
        p["html"] = color_suits(body).strip()

    for spec in cfg.get("escaliers", []):
        if spec["titre"] not in stairs_done:
            sys.exit(f"Erreur : tableau « {spec['titre']} » introuvable (paragraphe en gras + tableau).")
    unused = [b for b in blobs if b not in used_blobs]
    if unused:
        print(f"Attention : images de la configuration absentes du doc : {', '.join(unused)}")

    # --- couverture : première image (et son crédit) de la page indiquée, déplacée sur l'accueil ---
    cover = ""
    cov = cfg.get("couverture")
    if cov:
        page = next(p for p in pages if p["id"] == cov["page"])
        credit = re.escape(cov.get("credit", "\u0000"))
        m = re.search(r'<figure class="figure">.*?</figure>\s*(?:<p><em>' + credit + r'[^<]*</em></p>)?',
                      page["html"], re.S)
        if m:
            page["html"] = (page["html"][:m.start()] + page["html"][m.end():]).strip()
            cover = m.group(0).replace(' loading="lazy"', "").replace("<p><em>", '<p class="cover-credit"><em>')

    # --- sortie ---
    img_dir = out_dir / "img"
    if img_dir.exists():
        shutil.rmtree(img_dir)
    img_dir.mkdir(parents=True)
    for b in used_blobs:
        shutil.copy2(ROOT / blobs[b], img_dir / Path(blobs[b]).name)

    data = {"title": title, "byline": byline, "cover": cover, "pages": pages}
    js = (f"// Fichier généré par tools/cours_html.py ({Path(config_path).name}) "
          "à partir de l'export HTML du Claude Doc.\n"
          "// Ne pas modifier à la main : modifier le doc, réexporter, relancer le script.\n"
          "export default " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    (out_dir / "contenu.js").write_text(js, encoding="utf-8")
    print(f"{len(pages)} pages, {sum(len(p['sections']) for p in pages)} sections, "
          f"{len(used_blobs)} images → {out_dir.relative_to(ROOT)}/")


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) == 3 else ROOT / "tools" / "cours_config.json")
