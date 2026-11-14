// Code couleur des niveaux (web/js/config.js) : complet, sans doublon, et identique au tableau
// « Code couleur des niveaux » du cours (web/cours/contenu.js, généré depuis le Claude Doc).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVELS } from '../../web/js/config.js';
import contenu from '../../web/cours/contenu.js';

const css = readFileSync(new URL('../../web/css/style.css', import.meta.url), 'utf8');

test('six niveaux, couleurs et rangs du programme', () => {
  assert.deepEqual(LEVELS.map((l) => l.color), ['vert', 'bleu', 'jaune', 'orange', 'rouge', 'noir']);
  assert.deepEqual(LEVELS.map((l) => l.rank), ['Débutant', 'Élémentaire', 'Intermédiaire', 'Avancé', 'Expert', 'Maître']);
});

test('chaque niveau a sa teinte et son texte dans la feuille de style', () => {
  for (const l of LEVELS) {
    assert.match(css, new RegExp(`--niv-${l.n}: #[0-9a-f]{6}; --niv-${l.n}-ink: #[0-9a-f]{6};`), `niveau ${l.n}`);
  }
});

// Contraste WCAG du texte posé sur chaque couleur (pastilles, boutons) : 4,5 au moins.
test('contraste du texte sur la couleur de chaque niveau', () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  for (const l of LEVELS) {
    const [, bg, ink] = new RegExp(`--niv-${l.n}: (#[0-9a-f]{6}); --niv-${l.n}-ink: (#[0-9a-f]{6});`).exec(css);
    const [a, b] = [lum(bg), lum(ink)].sort((x, y) => y - x);
    assert.ok((a + 0.05) / (b + 0.05) >= 4.5, `niveau ${l.n} (${l.color})`);
  }
});

test('le cours présente le même code couleur que l\'application', () => {
  const page = contenu.pages.find((p) => p.id === 'mode-d-emploi');
  const m = /Code couleur des niveaux.*?<tbody>(.*?)<\/tbody>/s.exec(page.html);
  assert.ok(m, 'tableau « Code couleur des niveaux » absent du mode d\'emploi');
  const rows = [...m[1].matchAll(/<tr>(.*?)<\/tr>/gs)].map((r) => [...r[1].matchAll(/<td>(.*?)<\/td>/gs)]
    .map((c) => c[1].replace(/<[^>]+>/g, '').trim()));
  assert.deepEqual(rows.map((r) => [Number.parseInt(r[0], 10), r[1], r[2]]), LEVELS.map((l) => [l.n, l.color, l.rank]));
});
