#!/usr/bin/env python3
"""Fichier d'import mentor (module Banques, PRD banques §8) à partir des questions Leitner.

    python3 tools/leitner_export.py [doc/leitner/questions.md]

Lit les tableaux du Markdown (conventions en tête du fichier), et écrit à côté :
  - <nom>.zip : questions.csv, images/<ID>.png, banque.json (format d'échange mentor) ;
  - <nom>.csv : le même questions.csv, pour le relire dans un tableur.
Les images viennent de doc/leitner/images/ (tools/leitner_images.mjs) ; une image manquante
est une erreur. La banque est éditée ensuite dans mentor seulement : ce script sert à l'amorcer.
"""
import csv
import io
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUITS = {'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣'}
TYPES = {'VF': 'vrai_faux', 'QCM': 'qcm', 'NUM': 'valeur_numerique', 'AUTO': 'auto_evaluation'}


def cards_to_text(text):
    """`AH JH` → A♥ J♥ (les codes de cartes entre accents graves)."""
    def repl(m):
        codes = m.group(1).split()
        if all(re.fullmatch(r'[2-9TJQKA][SHDC]', c) for c in codes):
            return ' '.join(('10' if c[0] == 'T' else c[0]) + SUITS[c[1]] for c in codes)
        return m.group(1)
    return re.sub(r'`([^`]+)`', repl, text)


def read_questions(md):
    theme, head, out = None, None, []
    for line in md.splitlines():
        if line.startswith('## '):
            theme = line[3:].strip()
        if not line.startswith('|'):
            head = None
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if cells[0] == 'ID':
            head = cells
        elif head and not set(cells[0]) <= set('-'):
            row = dict(zip(head, cells))
            row['Thème'] = theme
            out.append(row)
    return out


def number(text):
    return text.replace('−', '-').replace(' ', '')


def to_csv_row(q, images):
    kind = TYPES[q['Type']]
    question = cards_to_text(q['Question'])
    answer = cards_to_text(q['Réponse'])
    why = cards_to_text(q['Pourquoi']).strip()
    explication = (why + ' ' if why else '') + f"Cours : {q['Section']}."
    # reference : l'ID du Markdown, stable d'un export à l'autre (mentor met à jour la question,
    # poker garde la progression), jamais montré à l'étudiant.
    row = {'type': kind, 'reference': q['ID'], 'explication': explication, 'theme': q['Thème'], 'difficulte': ''}

    if q['Cartes']:
        img = images / f"{q['ID']}.png"
        if not img.exists():
            sys.exit(f"{q['ID']} : image manquante ({img}) ; lancer node tools/leitner_images.mjs")
        row['illustration'] = img.name
        row['texte_alternatif'] = q['Image'] or f"Cartes : {cards_to_text(q['Cartes'])}"

    if kind == 'qcm':
        m = re.search(r'\[([^\]]+)\]', question)
        if not m:
            sys.exit(f"{q['ID']} : QCM sans choix entre crochets")
        choices = [c.strip() for c in m.group(1).split('·')]
        if answer not in choices:
            sys.exit(f"{q['ID']} : réponse « {answer} » absente des choix {choices}")
        stem = (question[:m.start()] + question[m.end():]).strip()
        row['enonce'] = stem or 'Que faites-vous ?'
        row['bonne_reponse'] = answer
        for i, c in enumerate([c for c in choices if c != answer], 1):
            row[f'mauvaise_reponse_{i}'] = c
        # Ordre fixe, celui des crochets du Markdown (« A · B · Partage », les dix combinaisons dans
        # l'ordre du classement) : colonne ordre (PRD banques §8.2). La position devient un repère.
        row['melange'] = 'non'
        row['ordre'] = ' | '.join(c.replace('\\', '\\\\').replace('|', '\\|').replace('=', '\\=') for c in choices)
    elif kind == 'vrai_faux':
        if answer not in ('Vrai', 'Faux'):
            sys.exit(f"{q['ID']} : vrai / faux attendu, pas « {answer} »")
        row['enonce'] = question
        row['reponse'] = answer.lower()
    elif kind == 'valeur_numerique':
        m = re.fullmatch(r'([−\-]?[\d ]+(?:,\d+)?)\s*(?:\(± *([\d,]+)\))?', answer)
        if not m:
            sys.exit(f"{q['ID']} : valeur numérique illisible « {answer} »")
        row['enonce'] = question
        row['valeur'] = number(m.group(1))
        row['type_tolerance'] = 'absolue' if m.group(2) else 'aucune'
        row['tolerance'] = m.group(2) or ''
        row['unite'] = '%' if '(%)' in question else 'BB' if re.search(r'\b(en|de) BB\b', question) else ''
    else:
        row['enonce'] = question
        row['reponse'] = answer
    return row


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'doc/leitner/questions.md'
    images = src.parent / 'images'
    questions = read_questions(src.read_text(encoding='utf-8'))
    ids = [q['ID'] for q in questions]
    if len(ids) != len(set(ids)):
        sys.exit('ID en double')
    rows = [to_csv_row(q, images) for q in questions]
    # Des énoncés identiques (questions qui ne diffèrent que par l'image) restent tels quels : la
    # colonne reference les distingue, pour mentor comme pour poker.

    n_wrong = max((int(k.rsplit('_', 1)[1]) for r in rows for k in r if k.startswith('mauvaise_reponse_')), default=0)
    columns = ['type', 'reference', 'enonce', 'explication', 'theme', 'difficulte', 'illustration', 'texte_alternatif',
               'reponse', 'valeur', 'type_tolerance', 'tolerance', 'unite', 'bonne_reponse',
               *[f'mauvaise_reponse_{i}' for i in range(1, n_wrong + 1)], 'melange', 'ordre']
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=columns, delimiter=';', lineterminator='\n', restval='')
    w.writeheader()
    w.writerows(rows)
    text = buf.getvalue()

    levels = sorted({int(re.match(r'Niveau (\d+)', q['Thème']).group(1)) for q in questions})
    params = {
        'format_version': 1,
        'nom': f"Poker — Réflexes, niveaux {levels[0]} à {levels[-1]}",
        'description': "Questions courtes du cours d'initiation au poker, à réponse immédiate, "
                       "souvent sur une image de main ou de tableau. Thème = niveau du cours.",
    }
    out = src.with_suffix('')
    out.with_suffix('.csv').write_text(text, encoding='utf-8')
    with zipfile.ZipFile(out.with_suffix('.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('questions.csv', text)
        z.writestr('banque.json', json.dumps(params, ensure_ascii=False, indent=2) + '\n')
        for r in rows:
            if r.get('illustration'):
                z.write(images / r['illustration'], f"images/{r['illustration']}")
    by_type = {}
    for r in rows:
        by_type[r['type']] = by_type.get(r['type'], 0) + 1
    print(f"{len(rows)} questions ({', '.join(f'{k} {v}' for k, v in sorted(by_type.items()))}), "
          f"{sum(1 for r in rows if r.get('illustration'))} images → {out.with_suffix('.zip').relative_to(ROOT)}")


if __name__ == '__main__':
    main()
