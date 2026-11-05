"""Compose card illustrations from the poker-qr SVG deck (rendered with rsvg-convert)."""
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont

SRC = sys.argv[1]          # dir with the SVG cards
OUT = sys.argv[2]          # output dir
CACHE = os.path.join(OUT, "_cache")
os.makedirs(CACHE, exist_ok=True)

CH = 168                    # card height in px (figures are rendered at 2x)
GAP = 10
FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 26)
FONTB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
FONTS = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
INK, QUIET, ACCENT = (31, 35, 40), (91, 99, 107), (31, 95, 168)


def card(code, h=CH):
    p = os.path.join(CACHE, f"{code}_{h}.png")
    if not os.path.exists(p):
        subprocess.run(["rsvg-convert", "-h", str(h), os.path.join(SRC, f"{code}.svg"), "-o", p], check=True)
    return Image.open(p).convert("RGBA")


def group(label, cards, sub=None, h=CH, label_font=FONTB, hl=None):
    """A labelled run of cards. hl = indices of cards to underline with the accent colour."""
    ims = [card(c, h) for c in cards]
    w = sum(i.width for i in ims) + GAP * (len(ims) - 1)
    lh = 40 if label else 0
    sh = 36 if sub else 0
    tw = max(w, int(label_font.getlength(label)) if label else 0, int(FONTS.getlength(sub)) if sub else 0)
    img = Image.new("RGBA", (tw, lh + h + sh + (10 if hl else 0)), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    if label:
        d.text((0, 2), label, font=label_font, fill=INK)
    x = 0
    for k, im in enumerate(ims):
        img.alpha_composite(im, (x, lh))
        if hl and k in hl:
            d.rectangle([x + 4, lh + h + 3, x + im.width - 4, lh + h + 8], fill=ACCENT)
        x += im.width + GAP
    if sub:
        d.text((0, lh + h + (10 if hl else 0) + 6), sub, font=FONTS, fill=QUIET)
    return img


def text_block(t, font=FONTB, color=INK, h=CH + 40):
    w = int(font.getlength(t)) + 4
    img = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    ImageDraw.Draw(img).text((0, 40 + CH // 2 - 16), t, font=font, fill=color)
    return img


def hstack(items, gap=48):
    w = sum(i.width for i in items) + gap * (len(items) - 1)
    h = max(i.height for i in items)
    img = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    x = 0
    for i in items:
        img.alpha_composite(i, (x, 0))
        x += i.width + gap
    return img


def vstack(items, gap=40):
    w = max(i.width for i in items)
    h = sum(i.height for i in items) + gap * (len(items) - 1)
    img = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    y = 0
    for i in items:
        img.alpha_composite(i, (0, y))
        y += i.height + gap
    return img


def save(img, name, pad=28):
    bg = Image.new("RGB", (img.width + 2 * pad, img.height + 2 * pad), "white")
    bg.paste(img, (pad, pad), img)
    bg.save(os.path.join(OUT, name), optimize=True)
    print(name, bg.size)


# 1. Une main complète (C1.1)
save(hstack([
    group("Vos cartes", ["AS", "KH"]),
    group("Flop", ["QH", "JC", "4D"]),
    group("Turn", ["TS"]),
    group("River", ["2C"]),
]), "fig-main-complete.png")

# 2. Classement des mains (C1.3)
H2 = 132
hands = [
    ("1 · Quinte flush royale", ["AS", "KS", "QS", "JS", "TS"]),
    ("2 · Quinte flush", ["9H", "8H", "7H", "6H", "5H"]),
    ("3 · Carré", ["KC", "KD", "KH", "KS", "4C"]),
    ("4 · Full", ["QS", "QH", "QD", "7C", "7S"]),
    ("5 · Couleur", ["AD", "JD", "8D", "5D", "2D"]),
    ("6 · Quinte", ["TC", "9D", "8S", "7H", "6C"]),
    ("7 · Brelan", ["8C", "8D", "8S", "KH", "3C"]),
    ("8 · Double paire", ["JH", "JC", "5S", "5D", "AC"]),
    ("9 · Paire", ["TH", "TS", "KC", "7D", "2S"]),
    ("10 · Carte haute", ["AS", "QD", "9C", "6H", "3S"]),
]
cols = [vstack([group(n, c, h=H2) for n, c in hands[i::2]], gap=28) for i in (0, 1)]
save(hstack(cols, gap=64), "fig-classement.png")

# 3. Les nuts (C1.4)
save(hstack([
    group("Tableau", ["KH", "QH", "7H", "4C", "2S"]),
    group("Les nuts", ["AH", "1B"], sub="As de cœur + n'importe quelle carte"),
]), "fig-nuts.png")

# 4. Assorties, dépareillées, connectées (C2.2)
save(hstack([
    group("AKs : assorties", ["AS", "KS"]),
    group("AKo : dépareillées", ["AS", "KD"]),
    group("98s : assorties connectées", ["9H", "8H"]),
    group("77 : paire servie", ["7C", "7D"]),
], gap=40), "fig-mains-depart.png")

# 5. Outs d'un tirage couleur (C3.1)
top = hstack([
    group("Vos cartes", ["AH", "8H"]),
    group("Flop", ["KH", "7H", "2C"]),
])
outs = group("Les 9 outs : les cœurs restants", ["2H", "3H", "4H", "5H", "6H", "9H", "TH", "JH", "QH"], h=110)
save(vstack([top, outs], gap=32), "fig-outs.png")

# 6. Duels préflop (C3.5)
H6 = 120
def duel(title, a, b, pct):
    return vstack([
        Image.new("RGBA", (1, 1), (255, 255, 255, 0)),
        hstack([group(title, a, h=H6), text_block("contre", font=FONT, color=QUIET, h=H6 + 40),
                group(" ", b, h=H6)], gap=20),
    ], gap=0)
def label(t, font=FONTB, color=INK, h=36):
    img = Image.new("RGBA", (int(font.getlength(t)) + 4, h), (255, 255, 255, 0))
    ImageDraw.Draw(img).text((0, 2), t, font=font, fill=color)
    return img
def duel_box(title, a, b, pct):
    vs = Image.new("RGBA", (int(FONT.getlength("contre")) + 4, H6), (255, 255, 255, 0))
    ImageDraw.Draw(vs).text((0, H6 // 2 - 16), "contre", font=FONT, fill=QUIET)
    row = hstack([group(None, a, h=H6), vs, group(None, b, h=H6)], gap=22)
    return vstack([label(title), row, label(f"Favori : {pct} d'équité", font=FONTS, color=QUIET, h=30)], gap=6)
d = [duel_box("Paire contre paire inférieure", ["KS", "KD"], ["QH", "QC"], "environ 82 %"),
     duel_box("Main dominée", ["AS", "KC"], ["AH", "QD"], "environ 74 %"),
     duel_box("Paire contre deux cartes hautes", ["8S", "8D"], ["AC", "KH"], "environ 55 %"),
     duel_box("Deux hautes contre deux basses", ["AD", "KS"], ["8H", "7C"], "environ 60 %")]
save(vstack([hstack(d[:2], gap=72), hstack(d[2:], gap=72)], gap=36), "fig-duels.png")

# 7. Textures de flop (C4.2)
H7 = 130
save(vstack([
    hstack([group("Sec", ["KS", "7D", "2C"], h=H7, sub="peu de tirages"),
            group("Humide", ["JH", "TH", "8C"], h=H7, sub="tirages couleur et quinte")], gap=72),
    hstack([group("Apparié", ["9S", "9D", "4C"], h=H7, sub="peu de mains touchent"),
            group("Monotone", ["QC", "8C", "3C"], h=H7, sub="couleur possible")], gap=72),
], gap=32), "fig-textures.png")

# 8. Réduire une range (C5.2)
save(hstack([
    group("Votre main", ["AD", "9S"]),
    group("Tableau au turn", ["AC", "8D", "3S", "KH"]),
], gap=56), "fig-range.png")
