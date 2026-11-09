"""Mise en page du PDF exporté du Claude Doc « Initiation au poker ».

L'export des Claude Docs ne gère ni les sauts de page ni la table des matières.
Ce script reprend le PDF exporté (papier A4) et :

1. fait commencer sur une nouvelle page « Les grands principes », « Mode d'emploi »,
   chaque « Niveau N », « Grille d'auto-évaluation », « Ressources d'entraînement »
   et « Glossaire » ; le contenu qui suit est recomposé page par page, en coupant
   seulement entre deux éléments (lignes, images, tableaux), jamais au milieu ;
2. insère en page 2 une table des matières avec numéros de page et liens cliquables ;
3. ajoute les signets PDF (le panneau de navigation des lecteurs PDF) ;
4. réécrit l'en-tête et le pied de page (« Page X sur N »).

Le rendu d'origine est conservé (vectoriel, polices embarquées) ; les liens sont recréés.

Usage : .venv/bin/python tools/mise_en_page_pdf.py export.pdf doc/initiation-poker-tutoriel.pdf
Dépendance : PyMuPDF (python3 -m venv .venv && .venv/bin/pip install pymupdf).
"""
import re
import sys

import pymupdf

# ---------- réglages ----------

TOP, BOT = 51.0, 786.4          # zone de contenu de l'export (A4, marges de Chromium)
HEADER_MAX, FOOTER_MIN = 30, 812  # en-tête et pied de page de l'export, à ignorer
GAP = 8.0                       # espace ajouté entre deux morceaux recollés
WIDOW = 0.20                    # dernière page d'une section remplie à moins de 20 % : on compacte
MIN_SCALE = 0.92                # réduction maximale pour gagner cette page
TITLE = "Initiation au poker — programme progressif"

# Titres qui commencent une nouvelle page (début du texte du titre).
BREAKS = [r"Les grands principes", r"Mode d'emploi", r"Niveau \d", r"Grille d'auto-évaluation",
          r"Ressources d'entraînement", r"Glossaire"]

H2_SIZE, H3_SIZE = 16.4, 13.4   # tailles minimales des titres (police serif de l'export)

# Polices de repli, quand un caractère manque dans les polices embarquées de l'export.
FALLBACK_SANS = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FALLBACK_SERIF = "/usr/share/fonts/truetype/noto/NotoSerif-Regular.ttf"
FONT_SMALL = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"   # en-tête et pied, comme l'export
INK = (0x1f / 255, 0x1e / 255, 0x1d / 255)
QUIET = (0x6b / 255, 0x6b / 255, 0x6b / 255)


class Fonts:
    """Polices de l'export (sous-ensembles embarqués), avec repli si un caractère manque."""

    def __init__(self, src):
        self.embedded = {}
        for pno in range(src.page_count):
            for xref, _, _, base, *_ in src.get_page_fonts(pno):
                key = base.split("+")[-1]
                if key in self.embedded:
                    continue
                buf = src.extract_font(xref)[3]
                if buf:
                    self.embedded[key] = buf
        self.cache = {}

    def pick(self, style, text):
        """(nom, buffer ou chemin) d'une police qui contient tous les caractères de text."""
        wanted = {"serif": ["AnthropicSerifPrint-Regular"], "sans": ["AnthropicSansPrint-Regular"]}[style]
        for key in wanted:
            buf = self.embedded.get(key)
            if buf and all(self.font(key, buf).has_glyph(ord(c)) for c in text if c != " "):
                return key, buf
        path = FALLBACK_SERIF if style == "serif" else FALLBACK_SANS
        return path.rsplit("/", 1)[-1].split(".")[0], path

    def font(self, key, buf_or_path):
        if key not in self.cache:
            self.cache[key] = (pymupdf.Font(fontbuffer=buf_or_path) if isinstance(buf_or_path, bytes)
                               else pymupdf.Font(fontfile=buf_or_path))
        return self.cache[key]

    def write(self, page, xy, text, style, size, color):
        """Écrit text ; renvoie sa largeur."""
        key, res = self.pick(style, text)
        name = "f" + "".join(ch for ch in key if ch.isalnum())[:20]
        if isinstance(res, bytes):
            page.insert_font(fontname=name, fontbuffer=res)
        else:
            page.insert_font(fontname=name, fontfile=res)
        page.insert_text(xy, text, fontname=name, fontsize=size, color=color)
        return self.font(key, res).text_length(text, fontsize=size)

    def width(self, text, style, size):
        key, res = self.pick(style, text)
        return self.font(key, res).text_length(text, fontsize=size)


def heading_level(line):
    spans = [s for s in line["spans"] if s["text"].strip()]
    if not spans or "Serif" not in spans[0]["font"]:
        return 0
    size = spans[0]["size"]
    return 2 if size >= H2_SIZE else 3 if size >= H3_SIZE else 0


def line_text(line):
    return "".join(s["text"] for s in line["spans"]).strip()


# ---------- 1. analyse de l'export ----------

def analyse(src):
    """Éléments de chaque page (intervalles verticaux) et titres."""
    pages = []
    headings = []
    for p in src:
        elems = []          # (y0, y1, genre) ; genre : 'text', 'heading', 'image', 'draw'
        for b in p.get_text("dict")["blocks"]:
            if b["bbox"][1] < HEADER_MAX or b["bbox"][3] > FOOTER_MIN:
                continue
            if b["type"] == 1:
                elems.append((b["bbox"][1], b["bbox"][3], "image"))
                continue
            for line in b["lines"]:
                y0, y1 = line["bbox"][1], line["bbox"][3]
                if y0 < HEADER_MAX or y1 > FOOTER_MIN or not line_text(line):
                    continue
                lvl = heading_level(line)
                elems.append((y0, y1, "heading" if lvl else "text"))
                if lvl:
                    headings.append({"page": p.number, "y": y0, "level": lvl, "text": line_text(line)})
        for dr in p.get_drawings():
            r = dr["rect"]
            if r.height > 600 or r.y1 < HEADER_MAX or r.y0 > FOOTER_MIN:
                continue    # cadre de la page
            elems.append((r.y0, r.y1, "draw"))
        elems.sort()
        pages.append(elems)
    # Un titre sur deux lignes : on fusionne les lignes consécutives de même niveau.
    merged = []
    for hd in headings:
        if merged and merged[-1]["page"] == hd["page"] and merged[-1]["level"] == hd["level"] \
                and 0 < hd["y"] - merged[-1]["y"] < 25:
            merged[-1]["text"] += " " + hd["text"]
        else:
            merged.append(hd)
    return pages, merged


def slug(text):
    """Identifiant d'ancre d'un titre, comme dans l'export HTML : « C3.7 Compter… » → c37-compter-…"""
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"\s+", "-", text.strip())


def is_break(hd):
    if hd["level"] == 2 and hd["text"].startswith("Initiation"):
        return False
    return any(re.match(pat, hd["text"]) for pat in BREAKS)


# ---------- 2. bande continue par section ----------

def sections(src, pages, headings):
    """Chaque section = une liste de morceaux (page, y0, y1) mis bout à bout."""
    cuts = [(hd["page"], hd["y"] - 3) for hd in headings if is_break(hd)]
    bounds = [(0, TOP - 1)] + cuts + [(len(src) - 1, BOT + 1)]
    out = []
    for (pa, ya), (pb, yb) in zip(bounds, bounds[1:]):
        pieces = []
        for pno in range(pa, pb + 1):
            y0 = ya if pno == pa else TOP - 1
            y1 = yb if pno == pb else BOT + 1
            inside = [e for e in pages[pno] if e[0] >= y0 - 0.5 and e[1] <= y1 + 0.5]
            if not inside:
                continue
            lo = min(e[0] for e in inside)
            hi = max(e[1] for e in inside)
            pieces.append({"page": pno, "y0": lo - 1, "y1": hi + 1, "elems": inside})
        out.append(pieces)
    return out


def strip(pieces):
    """Positionne les morceaux sur une bande continue ; renvoie les éléments en coordonnées de bande."""
    pos = 0.0
    elems = []
    for pc in pieces:
        pc["s0"] = pos
        for (y0, y1, kind) in pc["elems"]:
            elems.append((pos + y0 - pc["y0"], pos + y1 - pc["y0"], kind))
        pos += pc["y1"] - pc["y0"]
        pc["s1"] = pos
        pos += GAP
    return elems, pos - GAP


def cut_points(elems, use_draw=True):
    """Positions où l'on peut couper sans traverser un élément, et l'élément qui précède."""
    spans = [(a, b, k) for (a, b, k) in elems if use_draw or k != "draw"]
    spans.sort()
    cuts = []
    reach = -1e9
    last_kind = None
    for i, (a, b, k) in enumerate(spans):
        if i and a > reach + 0.1:
            cuts.append(((reach + a) / 2, last_kind))
        if b >= reach:
            reach, last_kind = b, k
    return cuts


def paginate(elems, length, height):
    """Découpe la bande en pages de hauteur ≤ height, aux points de coupe permis."""
    pages = []
    start = 0.0
    strict = cut_points(elems, True)
    loose = cut_points(elems, False)
    while length - start > height:
        limit = start + height

        def best(cands):
            ok = [c for c, kind in cands if start + 40 < c <= limit and kind != "heading"]
            return max(ok) if ok else None

        cut = best(strict)
        if cut is None or cut < start + height * 0.5:
            cut = best(loose) or cut or limit      # tableau trop long : coupe entre deux lignes
        pages.append((start, cut))
        start = cut
    pages.append((start, length))
    return pages


# ---------- 3. composition ----------

def cropped(src, pno, y0, y1, cache={}):
    """Copie de la page pno sans le texte hors de la bande [y0, y1].

    show_pdf_page ne fait que masquer ce qui dépasse du cadre : sans ce nettoyage, le texte
    caché resterait dans le fichier (doublons à la recherche et au copier-coller)."""
    key = (id(src), pno, round(y0, 2), round(y1, 2))
    if key not in cache:
        tmp = pymupdf.open()
        tmp.insert_pdf(src, from_page=pno, to_page=pno)
        page = tmp[0]
        w, h = page.rect.width, page.rect.height
        for r in (pymupdf.Rect(0, 0, w, y0 - 0.5), pymupdf.Rect(0, y1 + 0.5, w, h)):
            if r.height > 0:
                page.add_redact_annot(r, fill=False)
        page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE,
                              graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
                              text=pymupdf.PDF_REDACT_TEXT_REMOVE)
        cache[key] = tmp
    return cache[key]


def build(src_path, out_path):
    src = pymupdf.open(src_path)
    pages, headings = analyse(src)
    secs = sections(src, pages, headings)
    width, height = src[0].rect.width, src[0].rect.height
    out = pymupdf.open()
    where = []          # (page source, y0, y1, page sortie, y de destination, échelle, x0)
    full = BOT - TOP

    for pieces in secs:
        elems, length = strip(pieces)
        layout, scale = paginate(elems, length, full), 1.0
        last = layout[-1][1] - layout[-1][0]
        if len(layout) > 1 and last < WIDOW * full:
            # Quelques lignes seules en fin de section : on réduit un peu pour les remonter.
            k = 0.99
            while k >= MIN_SCALE - 1e-9:
                tighter = paginate(elems, length, full / k)
                if len(tighter) < len(layout):
                    layout, scale = tighter, k
                    break
                k -= 0.01
        x0 = width * (1 - scale) / 2
        for (s0, s1) in layout:
            page = out.new_page(width=width, height=height)
            for pc in pieces:
                a, b = max(s0, pc["s0"]), min(s1, pc["s1"])
                if b <= a:
                    continue
                y0 = pc["y0"] + (a - pc["s0"])
                y1 = pc["y0"] + (b - pc["s0"])
                dest_y = TOP + (a - s0) * scale
                clip = pymupdf.Rect(0, y0, width, y1)
                dest = pymupdf.Rect(x0, dest_y, x0 + width * scale, dest_y + (y1 - y0) * scale)
                page.show_pdf_page(dest, cropped(src, pc["page"], y0, y1), 0, clip=clip)
                where.append((pc["page"], y0, y1, page.number, dest_y, scale, x0))

    def place(w, x, y):
        sp, y0, y1, op, dest_y, sc, x0 = w
        return op, x0 + x * sc, dest_y + (y - y0) * sc, sc

    def locate(pno, y, x=0.0):
        """Page de sortie, x, y et échelle d'un point (pno, x, y) de l'export."""
        for w in where:
            if w[0] == pno and w[1] - 2 <= y <= w[2] + 2:
                return place(w, x, y)
        cands = [w for w in where if w[0] == pno]
        if not cands:
            return 0, x, TOP, 1.0
        w = min(cands, key=lambda w: min(abs(y - w[1]), abs(y - w[2])))
        return place(w, x, min(max(y, w[1]), w[2]))

    # Position finale de chaque titre.
    for hd in headings:
        op, _, y, _ = locate(hd["page"], hd["y"])
        hd["out"] = (op, y)
    by_slug = {slug(hd["text"]): hd for hd in headings}

    # Liens de l'export : on les reporte sur les nouvelles pages.
    links = []
    for p in src:
        for ln in p.get_links():
            r = ln["from"]
            op, x, y, sc = locate(p.number, (r.y0 + r.y1) / 2, r.x0)
            rect = pymupdf.Rect(x, y - r.height * sc / 2, x + r.width * sc, y + r.height * sc / 2)
            if ln["kind"] == pymupdf.LINK_URI:
                links.append((op, {"kind": pymupdf.LINK_URI, "from": rect, "uri": ln["uri"]}))
            elif ln.get("nameddest") in by_slug:          # renvoi vers un titre du document
                links.append((op, {"kind": pymupdf.LINK_GOTO, "from": rect, "target": by_slug[ln["nameddest"]]["out"]}))
            elif ln.get("page", -1) is not None and ln.get("page", -1) >= 0:
                # Destination en coordonnées PDF (origine en bas de page).
                to = ln.get("to")
                tp, _, ty, _ = locate(ln["page"], height - to.y if to else TOP)
                links.append((op, {"kind": pymupdf.LINK_GOTO, "from": rect, "target": (tp, ty)}))

    # ---------- table des matières ----------
    entries = [hd for hd in headings if hd["level"] in (2, 3) and not hd["text"].startswith("Initiation")]
    line_h, h2_gap, top = 13.0, 5.0, 112
    # Répartition sur autant de pages que nécessaire (une seule pour ce document).
    chunks, used = [[]], 0.0
    for hd in entries:
        need = line_h + (h2_gap if hd["level"] == 2 and chunks[-1] else 0)
        if used + need > BOT - top:
            chunks.append([])
            used, need = 0.0, line_h
        chunks[-1].append(hd)
        used += need
    toc_pages = len(chunks)
    for i in range(toc_pages):
        out.new_page(pno=1 + i, width=width, height=height)
    shift = toc_pages
    page_of = lambda op: op + (shift if op >= 1 else 0)      # la page 1 reste en tête

    fonts = Fonts(src)
    left, right = 72, width - 72
    for i in range(toc_pages):
        page = out[1 + i]
        if i == 0:
            fonts.write(page, (left, 84), "Table des matières", "serif", 22, INK)
        y = top
        for hd in chunks[i]:
            op, ty = hd["out"]
            num = str(page_of(op) + 1)
            h2 = hd["level"] == 2
            style, size, x = ("serif", 11.5, left) if h2 else ("sans", 9.5, left + 18)
            if h2 and y > top:
                y += h2_gap
            text_w = fonts.write(page, (x, y), hd["text"], style, size, INK)
            num_w = fonts.width(num, "sans", size)
            fonts.write(page, (right - num_w, y), num, "sans", size, INK)
            dot_w = fonts.width(" .", "sans", size)
            dots_x0, dots_x1 = x + text_w + 4, right - num_w - 4
            n = int((dots_x1 - dots_x0) / dot_w)
            if n > 0:
                fonts.write(page, (dots_x1 - n * dot_w, y), " ." * n, "sans", size, QUIET)
            page.insert_link({"kind": pymupdf.LINK_GOTO, "from": pymupdf.Rect(x, y - size, right, y + 3),
                              "page": page_of(op), "to": pymupdf.Point(0, max(ty - 12, 0))})
            y += line_h

    # ---------- liens recréés ----------
    for op, ln in links:
        page = out[page_of(op)]
        if ln["kind"] == pymupdf.LINK_GOTO:
            tp, ty = ln.pop("target")
            ln["page"], ln["to"] = page_of(tp), pymupdf.Point(0, max(ty - 12, 0))
        page.insert_link(ln)

    # ---------- en-tête, pied de page ----------
    total = out.page_count
    for page in out:
        page.insert_font(fontname="small", fontfile=FONT_SMALL)
        page.insert_text((20, 21), TITLE, fontname="small", fontsize=6, color=QUIET)
        label = f"Page {page.number + 1} sur {total}"
        w = pymupdf.Font(fontfile=FONT_SMALL).text_length(label, fontsize=6)
        page.insert_text((width - 20 - w, 827), label, fontname="small", fontsize=6, color=QUIET)

    # ---------- signets ----------
    toc = [[1, "Table des matières", 2]]
    for hd in entries:
        op, ty = hd["out"]
        toc.append([hd["level"] - 1, hd["text"], page_of(op) + 1, {"kind": pymupdf.LINK_GOTO, "to": pymupdf.Point(0, max(ty - 12, 0))}])
    out.set_toc(toc)
    out.set_metadata({**src.metadata, "title": TITLE})
    out.save(out_path, garbage=4, deflate=True)
    return total, toc_pages, entries


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    total, toc_pages, entries = build(sys.argv[1], sys.argv[2])
    print(f"{total} pages, dont {toc_pages} de table des matières ({len(entries)} entrées).")
