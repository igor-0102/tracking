/* Tracking · fuentes de alimentos.
   La interfaz de usuario solo usa Foods.search() y los objetos «alimento» que devuelve:
     { key, name, per100: { kcal, p, c, f, fiber, sugar, salt }, portions: [{ name, g }], src, cat }
   Para añadir otra fuente (una API, otra base de datos…) basta con registrarla con Foods.addSource(). */
'use strict';

const Foods = (() => {
  const normText = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  // Fila compacta de las bases generadas → alimento
  const fromRow = (r, src) => ({
    key: 'u:' + r[0], name: r[1],
    per100: { kcal: r[2], p: r[3], c: r[4], f: r[5], fiber: r[6], sugar: r[7], salt: Nutri.saltFromSodium(r[8]) },
    portions: (r[9] || []).map(([name, g]) => ({ name, g })),
    cat: r[10] || '', src,
  });

  // Una fuente = { id, label, items(): alimento[] } (síncrona, en memoria)
  function memorySource(id, label, getItems) {
    let cache = null, stamp = null;
    return {
      id, label,
      items() {
        const raw = getItems();
        if (raw !== stamp) { stamp = raw; cache = raw.map(f => ({ f, n: ' ' + words(f.name) })); }
        return cache;
      },
    };
  }

  // Texto en palabras sueltas: sin acentos ni signos de puntuación
  const words = s => normText(s).replace(/[^a-z0-9%]+/g, ' ').trim();

  let customList = [];
  const sources = [];
  const addSource = s => { sources.push(s); };

  addSource(memorySource('custom', 'Mis alimentos', () => customList));
  let esFoods = null;
  addSource(memorySource('es', 'Lista básica', () => (esFoods = esFoods || (window.FOODS_ES || []).map(r => fromRow(r, 'es')))));

  // Base completa del USDA (en inglés): se carga solo cuando se pide.
  let usdaFoods = null, usdaLoading = null;
  function loadUsda() {
    if (usdaFoods) return Promise.resolve(true);
    if (usdaLoading) return usdaLoading;
    usdaLoading = new Promise(res => {
      const sc = document.createElement('script');
      sc.src = 'foods-usda.js';
      sc.onload = () => { usdaFoods = (window.FOODS_USDA || []).map(r => fromRow(r, 'usda')); window.FOODS_USDA = null; res(true); };
      sc.onerror = () => { usdaLoading = null; res(false); };
      document.head.appendChild(sc);
    });
    return usdaLoading;
  }
  const usdaSource = memorySource('usda', 'USDA (inglés)', () => usdaFoods || []);

  // Busca en todas las fuentes. Todas las palabras de la consulta deben aparecer en el nombre.
  function search(query, { usda = false, limit = 60 } = {}) {
    const q = words(query);
    if (!q) return [];
    const toks = q.split(' ').map(t => ' ' + t);      // cada palabra debe empezar una palabra del nombre
    const out = [];
    const seen = new Set();
    const list = usda && usdaFoods ? [...sources, usdaSource] : sources;
    list.forEach((src, si) => {
      for (const { f, n } of src.items()) {
        if (seen.has(f.key) || !toks.every(t => n.includes(t))) continue;
        seen.add(f.key);
        const rank = n.startsWith(' ' + q) ? 0 : n.startsWith(toks[0]) ? 1 : 2;
        out.push({ f, score: si * 10 + rank, len: n.length });
      }
    });
    out.sort((a, b) => a.score - b.score || a.len - b.len);
    return out.slice(0, limit).map(x => x.f);
  }

  return {
    search, loadUsda, addSource, normText,
    usdaReady: () => !!usdaFoods,
    setCustom(list) { customList = list; },
    customToFood: c => ({ key: 'c:' + c.id, name: c.name, per100: c.per100, portions: c.portions || [], src: 'custom', cat: 'Mis alimentos' }),
  };
})();
