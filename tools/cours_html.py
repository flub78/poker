"""Publie un Claude Doc sous forme de site à pages : le « Cours » de l'application (web/).

Source : l'export HTML (format `html`) du doc. Tout ce qui est propre au doc est dans un fichier
de configuration JSON (par défaut tools/cours_config.json) :

    auteur          nom affiché à la place de la mention de l'auteur
    sortie          dossier écrit : <sortie>/contenu.js et <sortie>/img/
    chemin_images   chemin des images vu depuis la page web
    images          id de blob du doc → fichier local (une image nouvelle doit y être ajoutée)
    pages           une entrée par titre de niveau 2, dans l'ordre :
                    { titre (expression régulière), id, court?, annexe?, decouper? }
                    decouper : une page par sous-titre h3 (id <id>-<sous-titre>), par exemple
                    l'annexe Aide-mémoire, une page par niveau
    couverture      { page, credit } : la première image de cette page, et le paragraphe
                    en italique qui commence par `credit`, vont sur l'accueil
    escaliers       tableaux à dessiner en escalier : { titre, prefixe, legende }. Le tableau
                    suit un paragraphe en gras égal à `titre` ; colonnes : étape, objectif,
                    durée, test pour passer à l'étape suivante.
    glossaire       liens vers le glossaire : { page, pages_sans_liens, ignorer, formes, exclure }.
                    Chaque ligne du tableau du glossaire reçoit un id (g-<terme>). Dans chaque
                    section (h3) des autres pages, la première occurrence de chaque terme devient
                    un lien vers sa ligne (jamais dans un titre, une tête de tableau ou un lien).
                    Dans le glossaire, les définitions (colonne « Sens ») renvoient de même aux
                    autres termes, une fois par ligne.
                    Forme de base : le terme avant sa parenthèse, pluriel en s/x accepté ;
                    `formes` ajoute synonymes et conjugaisons, `exclure` liste les expressions
                    où un mot du glossaire a un autre sens (« même couleur », « ce tableau »).

Un tableau dont la ligne de tête est « (vide) A K Q J T 9 … 2 » devient une grille des mains à
colorier (classe grille-mains : cases carrées, paires / assorties / dépareillées repérées).

Le script remplace aussi ce que l'export ne sait pas rendre hors de Claude Docs :
- les liens internes du doc (#<id de bloc>), résolus par le texte du lien (« C3.7 », ou le titre
  d'une grande partie) ;
- les renvois écrits en texte : « C2.2 » devient un lien vers la section, et dans « Face à une
  relance » (C2.2) le titre entre guillemets mène au paragraphe de C2.2 qui commence par ce titre
  en gras (id <section>--<titre>) ;
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


RANKS = "AKQJT98765432"


def hand_grids(body):
    """Tableau 13 × 13 des mains (en-têtes A … 2) : grille à colorier, cases carrées.
    Ligne de tête et première colonne en <th>, chaque case marquée paire / assortie / dépareillée."""
    head = "<thead><tr><th></th>" + "".join(f"<th>{r}</th>" for r in RANKS) + "</tr></thead>"

    def cell(m):
        text = m.group(1)
        kind = "paire" if len(text) == 2 and text[0] == text[1] else "assortie" if text.endswith("s") else "depareillee"
        return f'<td class="{kind}">{text}</td>'

    def grid(m):
        rows = re.sub(r"<tr><td><strong>([A-Z0-9])</strong></td>", r'<tr><th scope="row">\1</th>', m.group(1))
        rows = re.sub(r"<td>([AKQJT2-9]{2}s?)</td>", cell, rows)
        cols = "".join(f'<th scope="col">{r}</th>' for r in RANKS)
        return f'<table class="grille-mains"><thead><tr><th></th>{cols}</tr></thead><tbody>{rows}</tbody></table>'
    return re.sub(r"<table>" + re.escape(head) + r"<tbody>(.*?)</tbody></table>", grid, body, flags=re.S)


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
    for t in re.finditer(r"<p(?: [^>]*)?><strong>([^<]*)</strong></p>\s*<div class=\"table-wrap\"><table>.*?<tbody>(.*?)</tbody></table></div>",
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


def glossary_terms(page_html, spec):
    """Lit le tableau du glossaire : pose un id sur chaque ligne (g-<terme>) et renvoie
    (html avec ids, [(id, [formes])]). La forme de base est le terme avant sa parenthèse ;
    `formes` en ajoute (synonymes, conjugaisons, pluriels irréguliers)."""
    extra = dict(spec.get("formes", {}))
    ignored = set(spec.get("ignorer", []))
    terms = []

    def row(m):
        cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", m.group(2), re.S)
        if not cells or m.group(2).lstrip().startswith("<th"):
            return m.group(0)
        term = plain(cells[0])
        gid = "g-" + slug(term)
        if term not in ignored:
            base = re.split(r" \(", term)[0]
            forms = ([] if " / " in base else [base]) + extra.pop(term, [])
            terms.append((gid, forms))
        return f'<tr id="{gid}"{m.group(1) or ""}>{m.group(2)}</tr>'
    page_html = re.sub(r"<tr( [^>]*)?>(.*?)</tr>", row, page_html, flags=re.S)
    if extra:
        sys.exit(f"Erreur : glossaire, « formes » pour des termes absents du tableau : {', '.join(extra)}")
    return page_html, terms


def form_pattern(form):
    """Une forme → expression régulière : espaces souples, pluriel en s/x facultatif.
    Les sigles (tout en majuscules) respectent la casse, le reste non."""
    words = [re.escape(w) for w in form.replace("’", "'").split()]
    pat = r"[\s ]+".join(words).replace("'", "['’]")
    if not form[-1] in "sx" and form[-1].isalpha():
        pat += "[sx]?"
    if form == form.upper() and any(c.isalpha() for c in form):
        return f"(?-i:{pat})"
    return pat


def link_glossary(body, terms, page_id, spec, glossary=False):
    """Remplace la première occurrence de chaque terme du glossaire, dans chaque section (h3),
    par un lien vers sa ligne. Jamais dans un titre, un lien existant ou une expression exclue.
    glossary=True : le glossaire lui-même ; seule la colonne « Sens » (2e) est liée, une fois par
    ligne, et jamais vers la ligne où l'on est."""
    groups = []
    for i, (gid, forms) in enumerate(terms):
        for f in forms:
            groups.append((len(f), f"(?P<t{i}_{len(groups)}>{form_pattern(f)})"))
    groups.sort(key=lambda g: -g[0])
    W = r"[^\W_]"   # lettre ou chiffre (accents compris)
    rx = re.compile(rf"(?<!{W})(?:{'|'.join(g for _, g in groups)})(?!{W}|-{W})", re.I)
    excl = [form_pattern(e).removesuffix("[sx]?") for e in spec.get("exclure", [])]
    excl_rx = re.compile("|".join(excl), re.I) if excl else None

    out, seen, skip = [], set(), 0
    row, cell = None, 0
    for tok in re.split(r"(<[^>]+>)", body):
        if tok.startswith("<"):
            tag = re.match(r"</?(\w+)", tok)
            name = tag.group(1).lower() if tag else ""
            opening = not tok.startswith("</")
            if name in ("a", "h1", "h2", "h3", "h4", "th"):
                skip += 1 if opening else -1
            if name == "h3" and opening:
                seen = set()          # nouvelle section
            if glossary and name == "tr" and opening:
                m = re.search(r'id="([^"]+)"', tok)
                row, cell, seen = (m.group(1) if m else None), 0, set()
            if glossary and name == "td" and opening:
                cell += 1
            out.append(tok)
            continue
        if glossary and (cell != 2 or row is None):
            out.append(tok)
            continue
        if skip or not tok.strip():
            out.append(tok)
            continue
        text = html.unescape(tok)
        blocked = [m.span() for m in excl_rx.finditer(text)] if excl_rx else []
        pos, parts = 0, []
        for m in rx.finditer(text):
            gid = terms[int(m.lastgroup[1:].split("_")[0])][0]
            if gid in seen or gid == row or any(a < m.end() and m.start() < b for a, b in blocked):
                continue
            seen.add(gid)
            parts += [html.escape(text[pos:m.start()], quote=False),
                      f'<a class="gl" href="#cours/{page_id}/{gid}">{html.escape(m.group(0), quote=False)}</a>']
            pos = m.end()
        parts.append(html.escape(text[pos:], quote=False))
        out.append("".join(parts))
    return "".join(out)


def lead_anchors(body, section_ids):
    """Paragraphes qui commencent par un titre en gras (« <strong>Face à une relance.</strong> … ») :
    chacun reçoit un id <section>--<titre>, pour qu'un renvoi « Face à une relance » (C2.2) y mène.
    Renvoie (html, {(id de section, slug du titre): id})."""
    anchors, current = {}, None
    out = []
    for part in re.split(r'(<h3 id="[^"]+">)', body):
        m = re.match(r'<h3 id="([^"]+)">', part)
        if m:
            current = m.group(1)
            out.append(part)
            continue

        def para(m):
            if current is None or current not in section_ids:
                return m.group(0)
            key = slug(plain(m.group(1)).rstrip(" .:"))
            aid = f"{current}--{key}"
            anchors[(current, key)] = aid
            return f'<p id="{aid}"><strong>{m.group(1)}</strong>'
        out.append(re.sub(r"<p><strong>(.*?)</strong>", para, part, flags=re.S))
    return "".join(out), anchors


CODE_RX = re.compile(r"(?:«\s*(?P<q>[^«»<]+?)\s*»(?P<sep>\s*\(\s*|\s*,\s*))?(?<![\w.])(?P<c>C\d\.\d)(?![\w.]\w)")


def link_codes(body, codes, anchors, page_title):
    """Renvois en texte vers une section (« C2.2 », « Face à une relance » (C2.2)) → liens.
    Le code mène à la section ; un titre entre guillemets qui précède le code mène au paragraphe
    de cette section qui commence par ce titre en gras. Jamais dans un titre, une tête de tableau
    ou un lien existant."""
    out, skip = [], 0
    for tok in re.split(r"(<[^>]+>)", body):
        if tok.startswith("<"):
            tag = re.match(r"</?(\w+)", tok)
            if tag and tag.group(1).lower() in ("a", "h1", "h2", "h3", "h4", "th"):
                skip += -1 if tok.startswith("</") else 1
            out.append(tok)
            continue
        if skip or "C" not in tok:
            out.append(tok)
            continue
        text = html.unescape(tok)
        pos, parts = 0, []
        for m in CODE_RX.finditer(text):
            code = m.group("c")
            if code not in codes:
                sys.exit(f"Erreur : renvoi « {code} » ({page_title}) sans section correspondante.")
            href = codes[code]
            parts.append(html.escape(text[pos:m.start()], quote=False))
            if m.group("q"):
                quote = f"« {m.group('q')} »"
                aid = anchors.get((href.rsplit("/", 1)[1], slug(m.group("q"))))
                if aid:
                    page = href.split("/")[1]
                    parts.append(f'<a href="#cours/{page}/{aid}">{html.escape(quote, quote=False)}</a>')
                else:                 # citation (« des As forts »), pas un titre : texte inchangé
                    parts.append(html.escape(text[m.start():m.start("sep")], quote=False))
                parts.append(html.escape(m.group("sep"), quote=False))
            parts.append(f'<a href="{href}">{code}</a>')
            pos = m.end()
        parts.append(html.escape(text[pos:], quote=False))
        out.append("".join(parts))
    return "".join(out)


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

        if spec.get("decouper"):
            # une page par sous-titre h3 : <id>-<sous-titre>, titre « <h2> — <h3> »
            parts = re.split(r'(?=<h3 id=")', body)
            if parts[0].strip():
                sys.exit(f"Erreur : texte avant le premier sous-titre de « {h2} » (decouper).")
            for part, sub in zip(parts[1:], subs):
                part = re.sub(r"^<h3[^>]*>.*?</h3>\s*", "", part, flags=re.S)
                pages.append({"id": f"{spec['id']}-{sub['id']}", "title": f"{h2} — {sub['title']}",
                              "short": f"{spec.get('court') or h2}, {sub['title'][0].lower()}{sub['title'][1:]}",
                              "subtitle": None, "annex": bool(spec.get("annexe")), "sections": [],
                              "html": part})
            continue
        pages.append({"id": spec["id"], "title": h2, "short": spec.get("court") or h2.split(" — ")[0],
                      "subtitle": h2.split(" — ")[1] if " — " in h2 else None,
                      "annex": bool(spec.get("annexe")), "sections": subs, "html": body})

    # index des sections, pour résoudre les liens internes par leur texte (« C3.7 »)
    # (un lien peut aussi viser une grande partie par son titre : « Grille des mains à colorier »)
    index = {}
    for p in pages:
        index[plain(p["title"])] = f"#cours/{p['id']}"
        for s in p["sections"]:
            index[s["title"].split(" ")[0]] = index[s["title"]] = f"#cours/{p['id']}/{s['id']}"

    # renvois en texte (« C2.2 ») : le code de chaque section, et les paragraphes à titre en gras
    codes = {s["title"].split(" ")[0]: f"#cours/{p['id']}/{s['id']}"
             for p in pages for s in p["sections"] if re.fullmatch(r"C\d\.\d", s["title"].split(" ")[0])}
    anchors = {}
    for p in pages:
        p["html"], found = lead_anchors(p["html"], {codes[c].rsplit("/", 1)[1] for c in codes})
        anchors.update(found)

    gspec = cfg.get("glossaire")
    terms = []
    if gspec:
        gpage = next(p for p in pages if p["id"] == gspec["page"])
        gpage["html"], terms = glossary_terms(gpage["html"], gspec)

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
        body = link_codes(body, codes, anchors, p["title"])

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
        body = hand_grids(body)
        body = re.sub(r"<table( [^>]*)?>", r'<div class="table-wrap"><table\1>', body)
        body = body.replace("</table>", "</table></div>")
        for spec in cfg.get("escaliers", []):
            body, done = stairs(body, spec)
            if done:
                stairs_done.add(spec["titre"])
        if terms and p["id"] == gspec["page"]:
            body = link_glossary(body, terms, gspec["page"], gspec, glossary=True)
        elif terms and p["id"] not in gspec.get("pages_sans_liens", []):
            body = link_glossary(body, terms, gspec["page"], gspec)
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
