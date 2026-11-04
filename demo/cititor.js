/* Cititorul de documente: deschide PDF, poză sau text în aplicație și le transformă în text dintr-un singur buton.
   Totul rulează în browser, deci documentul nu pleacă spre un serviciu extern. Paginile cu text digital ies imediat; cele scanate
   trec prin Tesseract (română), în fundal. Dacă se șterge PDF-ul, paginile rămân ca poze până când textul e complet. */
'use strict';

const TESS_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const TEXT_MIN = 40; /* sub atâtea caractere pe pagină, considerăm pagina scanată */
const OCR = { lista: [], ruleaza: false, activ: null, worker: null, pct: 0 };
const VW = { doc: null, mod: 'doc', zoom: 1 };
const ocrDb = () => R.db.ocr || (R.db.ocr = {});
const ocrRec = (id) => ocrDb()[id];
const textDin = (r) => Object.keys(r.pagini || {}).map(Number).sort((a, b) => a - b).map((n) => (r.total > 1 ? '--- Pagina ' + n + ' ---\n' : '') + r.pagini[n].text).join('\n\n');
const felDoc = (d) => { const m = d.mime || '', n = d.nume || ''; if (/pdf/.test(m) || /\.pdf$/i.test(n)) return 'pdf'; if (/^image\//.test(m) || /\.(jpe?g|png|webp|heic)$/i.test(n)) return 'img'; if (/^text\//.test(m) || /\.(txt|csv|md)$/i.test(n)) return 'txt'; return 'alt'; };
const potSterge = () => ['admin', 'tehnic', 'operator'].includes(UI.role);
const pctOcr = (r) => (r && r.total ? Math.round(Object.keys(r.pagini || {}).length / r.total * 100) : 0);

/* eticheta de stare din liste și butonul „În text” */
function ocrChip(id) {
  const r = ocrRec(id);
  if (!r) return '';
  const n = Object.keys(r.pagini || {}).length;
  return '<span class="chip ' + (r.stare === 'gata' ? 'verde' : r.stare === 'eroare' ? 'rosu' : 'galben') + '" data-ocrid="' + id + '">' + (r.stare === 'gata' ? 'text gata' : r.stare === 'eroare' ? 'text: eroare' : 'text ' + n + '/' + (r.total || '…')) + '</span>';
}
function docLinie(d) {
  return '<span class="docl"><a href="#" data-a="vfile" data-id="' + d.id + '">' + esc(d.nume) + '</a> ' + (d.sters_la ? tag(d.capturi && d.capturi.length ? 'capturi' : 'doar text', 'gri') + ' ' : '') + ocrChip(d.id) + (!ocrRec(d.id) || ocrRec(d.id).stare === 'eroare' ? ' ' + btn('optext', 'În text', { id: d.id, c: 'mic' }) : '') + '</span>';
}

/* ---------- capturi (pagini păstrate ca poze): pe dispozitiv și, cu sincronizare, în bucketul „documente” ---------- */
function capDb() { return new Promise((ok, err) => { const q = indexedDB.open('dd_capturi_demo', 1); q.onupgradeneeded = () => q.result.createObjectStore('p'); q.onsuccess = () => ok(q.result); q.onerror = () => err(q.error); }); }
async function capPune(k, blob) { const db = await capDb(); await new Promise((ok, err) => { const t = db.transaction('p', 'readwrite'); t.objectStore('p').put(blob, k); t.oncomplete = ok; t.onerror = () => err(t.error); }); }
async function capIa(k) { const db = await capDb(); return new Promise((ok, err) => { const q = db.transaction('p').objectStore('p').get(k); q.onsuccess = () => ok(q.result || null); q.onerror = () => err(q.error); }); }
async function capScoate(k) { const db = await capDb(); await new Promise((ok) => { const t = db.transaction('p', 'readwrite'); t.objectStore('p').delete(k); t.oncomplete = ok; t.onerror = ok; }); }
const capCale = (d, n) => d.comanda + '/' + d.task + '/capturi_' + d.id + '_p' + String(n).padStart(3, '0') + '.jpg';
async function capturaPagina(d, n) {
  const local = await capIa(d.id + ':' + n).catch(() => null); if (local) return local;
  if (!SYNC.on) return null;
  const { data } = await SYNC.sb.storage.from('documente').download(capCale(d, n));
  return data || null;
}
async function curataCapturi(d) {
  const ns = d.capturi || []; for (const n of ns) await capScoate(d.id + ':' + n);
  if (SYNC.on && ns.length) await SYNC.sb.storage.from('documente').remove(ns.map((n) => capCale(d, n)));
  d.capturi = [];
}

/* ---------- sursa documentului ---------- */
async function urlDoc(d) { return FILEBLOBS[d.id] || (d.path ? await syncFileUrl(d) : null); }
async function deschidePdf(url) { const lib = await pdfLib(); return lib.getDocument(url).promise; }
async function canvasPagina(pdf, n, scala) { const p = await pdf.getPage(n); const vp = p.getViewport({ scale: scala }); const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; /* intent „print”: fără requestAnimationFrame, care stă pe loc când fila nu e în față */ await p.render({ canvasContext: c.getContext('2d'), viewport: vp, intent: 'print' }).promise; return c; }
const blobDin = (c, q) => new Promise((ok) => c.toBlob(ok, 'image/jpeg', q || 0.8));
async function textPagina(pdf, n) { const p = await pdf.getPage(n); const c = await p.getTextContent(); let y0 = null, out = ''; c.items.forEach((it) => { const y = Math.round(it.transform[5]); if (y0 !== null && Math.abs(y - y0) > 2) out += '\n'; else if (out && !out.endsWith(' ')) out += ' '; out += it.str; y0 = y; }); return out.trim(); }

/* ---------- transformarea în text ---------- */
async function motorOcr() {
  if (OCR.worker) return OCR.worker;
  if (!window.Tesseract) await new Promise((ok, err) => { const s = document.createElement('script'); s.src = TESS_URL; s.onload = ok; s.onerror = () => err(new Error('Nu s-a putut încărca motorul de text (fără internet?).')); document.head.appendChild(s); });
  OCR.worker = await window.Tesseract.createWorker('ron', 1, { logger: (m) => { if (m.status === 'recognizing text') { OCR.pct = Math.round(m.progress * 100); actualizeazaOcr(); } } });
  return OCR.worker;
}
async function citesteImagine(src) { const w = await motorOcr(); const { data } = await w.recognize(src); return { text: (data.text || '').trim(), conf: Math.round(data.confidence || 0) }; }
function salveaza(r) { r.la_ult = now(); R.save(); actualizeazaOcr(); }
async function proceseaza(id) {
  const d = D('documente')[id], r = ocrRec(id); r.stare = 'in_lucru'; salveaza(r);
  const pune = (n, text, sursa, conf) => { r.pagini[n] = { text, sursa, conf: conf == null ? null : conf }; salveaza(r); };
  if (d.sters_la) {
    const ns = (d.capturi || []).filter((n) => !r.pagini[n]);
    if (!r.total) r.total = (d.capturi || []).length;
    for (const n of ns) { const b = await capturaPagina(d, n); if (!b) throw new Error('Lipsește captura paginii ' + n); const x = await citesteImagine(b); pune(n, x.text, 'ocr', x.conf); }
  } else {
    const fel = felDoc(d), url = await urlDoc(d);
    if (!url) throw new Error('Fișierul nu e disponibil pe acest dispozitiv.');
    if (fel === 'txt') { r.total = 1; const t = await (await fetch(url)).text(); pune(1, t, 'text'); }
    else if (fel === 'img') { r.total = 1; if (!r.pagini[1]) { const x = await citesteImagine(url); pune(1, x.text, 'ocr', x.conf); } }
    else if (fel === 'pdf') {
      const pdf = await deschidePdf(url); r.total = pdf.numPages; salveaza(r);
      /* întâi tot ce are text digital (instantaneu), apoi scanurile */
      const scan = [];
      for (let n = 1; n <= pdf.numPages; n++) { if (r.pagini[n]) continue; const t = await textPagina(pdf, n); if (t.replace(/\s/g, '').length >= TEXT_MIN) pune(n, t, 'pdf'); else scan.push(n); }
      for (const n of scan) { const c = await canvasPagina(pdf, n, 2); const x = await citesteImagine(c); pune(n, x.text, 'ocr', x.conf); }
    } else throw new Error('Tip de fișier necunoscut.');
  }
  r.stare = 'gata'; r.gata_la = now(); r.eroare = '';
  ev('document.text', 'motor', { k: 'task', id: d.task }, { nume: d.nume, pagini: r.total });
  if (d.sters_la) await curataCapturi(d);
  salveaza(r); if (typeof toast === 'function' && !typingNow() && !MODAL) toast('Text gata: ' + d.nume);
}
async function ruleaza() {
  if (OCR.ruleaza) return; OCR.ruleaza = true;
  while (OCR.lista.length) {
    const id = OCR.lista.shift(); OCR.activ = id; OCR.pct = 0;
    try { await proceseaza(id); } catch (e) { console.error(e); const r = ocrRec(id); if (r) { r.stare = 'eroare'; r.eroare = e.message; salveaza(r); } }
    OCR.activ = null; actualizeazaOcr();
  }
  OCR.ruleaza = false;
}
function ocrPorneste(id) {
  const r0 = ocrRec(id); if (r0 && r0.stare === 'gata') return;
  if (OCR.activ === id || OCR.lista.includes(id)) return;
  const d = D('documente')[id]; if (!d) return;
  if (!r0) ocrDb()[id] = { id, doc: id, comanda: d.comanda, task: d.task, stare: 'in_coada', total: 0, pagini: {}, de: (UI.auth || {}).nume || '', pornit_la: now() };
  else { r0.stare = 'in_coada'; r0.eroare = ''; }
  R.save(); OCR.lista.push(id); actualizeazaOcr(); ruleaza();
}
/* ce a rămas neterminat la o închidere a filei se reia singur, pe dispozitivul care a pornit transformarea */
function reiaOcr() { if (!UI.auth || !R.db) return; Object.values(ocrDb()).filter((r) => ['in_coada', 'in_lucru'].includes(r.stare) && r.de === (UI.auth.nume || '') && r.id !== OCR.activ && !OCR.lista.includes(r.id)).forEach((r) => { OCR.lista.push(r.id); }); ruleaza(); }

/* ---------- ștergerea PDF-ului: paginile rămân ca poze până când textul e complet ---------- */
const motivPastrare = (d) => (d.vizibil ? 'Documentul e deja la client.' : L('taskuri', (x) => x.linie === d.linie && x.out && x.out === d.tip).length ? 'Documentul se trimite clientului la final.' : '');
async function stergeFisier(id) {
  const d = D('documente')[id]; const motiv = motivPastrare(d);
  if (motiv) { toast(motiv + ' Nu se șterge.'); return; }
  const r = ocrRec(id), complet = r && r.stare === 'gata', fel = felDoc(d);
  if (!window.confirm('Ștergi fișierul „' + d.nume + '”?\n\n' + (complet ? 'Textul rămâne în aplicație.' : 'Paginile rămân ca poze până când textul e complet; apoi rămâne doar textul.') + '\nFișierul original nu se poate recupera.')) return;
  VW.lucru = 'Se pregătesc capturile…'; deseneazaVw();
  const url = await urlDoc(d);
  if (!complet) {
    if (!url) { VW.lucru = ''; deseneazaVw(); toast('Fișierul nu e disponibil pe acest dispozitiv, așa că nu am șters nimic.'); return; }
    const pag = [];
    try {
      if (fel === 'pdf') { const pdf = await deschidePdf(url); for (let n = 1; n <= pdf.numPages; n++) { if (r && r.pagini[n]) continue; const c = await canvasPagina(pdf, n, 2); pag.push([n, await blobDin(c, 0.8)]); VW.lucru = 'Captură ' + n + ' din ' + pdf.numPages; deseneazaVw(); } if (!r) ocrPorneste(id); const rr = ocrRec(id); rr.total = pdf.numPages; }
      else pag.push([1, await (await fetch(url)).blob()]);
      for (const [n, b] of pag) { await capPune(id + ':' + n, b); if (SYNC.on) { const { error } = await SYNC.sb.storage.from('documente').upload(capCale(d, n), b, { upsert: true, contentType: 'image/jpeg' }); if (error) throw error; } }
    } catch (e) { VW.lucru = ''; deseneazaVw(); toast('Capturile nu s-au salvat, așa că fișierul a rămas neatins. ' + e.message); return; }
    d.capturi = pag.map((p) => p[0]);
  }
  if (SYNC.on && d.path) { const { error } = await SYNC.sb.storage.from('documente').remove([d.path]); if (error) { VW.lucru = ''; deseneazaVw(); toast('Nu s-a putut șterge: ' + error.message); return; } }
  d.sters_la = now(); d.sters_de = (UI.auth || {}).nume || ''; d.path = null; delete FILEBLOBS[id];
  ev('document.sters', 'operator', { k: 'task', id: d.task }, { nume: d.nume });
  VW.lucru = ''; R.save();
  if (!complet) { const rr = ocrRec(id); if (OCR.activ !== id) { if (rr) rr.stare = 'eroare'; ocrPorneste(id); } }
  deschideDoc(id); toast(complet ? 'Fișier șters. Textul a rămas.' : 'Fișier șters. Capturile rămân până la textul complet.');
}

/* ---------- fereastra cititorului (în afara #app, ca redesenarea aplicației să nu o închidă) ---------- */
function radacina() { let v = document.getElementById('vw'); if (!v) { v = document.createElement('div'); v.id = 'vw'; document.body.appendChild(v); v.addEventListener('click', laClick); } return v; }
function barut(a, t, c, dis) { return '<button class="b ' + (c || '') + '" data-v="' + a + '"' + (dis ? ' disabled' : '') + '>' + t + '</button>'; }
function deseneazaVw() {
  const v = radacina(); if (!VW.doc) { v.innerHTML = ''; v.className = ''; return; }
  const d = D('documente')[VW.doc], r = ocrRec(VW.doc);
  v.className = 'vw';
  const cap = v.querySelector('.vwh');
  const htmlCap = '<div class="vwn"><b>' + esc(d.nume) + '</b> <span id="vwst">' + ocrChip(VW.doc) + '</span>' + (VW.lucru ? ' <span class="small">' + esc(VW.lucru) + '</span>' : '') + '</div><div class="vwa">' +
    (['doc', 'text', 'alaturi'].map((m) => barut('m:' + m, { doc: 'Document', text: 'Text', alaturi: 'Alături' }[m], VW.mod === m ? 'pri mic' : 'mic')).join('')) +
    (!r || r.stare === 'eroare' ? barut('ocr', 'Transformă în text', 'pri mic', VW.lucru) : '') +
    (r && Object.keys(r.pagini).length ? barut('copie', 'Copiază textul', 'mic') + barut('txt', 'Descarcă .txt', 'mic') : '') +
    (potSterge() && !d.sters_la ? barut('sterge', 'Șterge fișierul', 'mic war', VW.lucru) : '') + barut('z', '✕ Închide', 'mic') + '</div>';
  if (cap) cap.innerHTML = htmlCap;
  else { v.innerHTML = '<div class="vwh">' + htmlCap + '</div><div class="vwb"><div class="vwd" id="vwd"></div><div class="vwt" id="vwt"></div></div>'; continut(d); }
  const b = v.querySelector('.vwb'); b.dataset.mod = VW.mod; textul();
}
function textul() {
  const e = document.getElementById('vwt'); if (!e || !VW.doc) return; const r = ocrRec(VW.doc), d = D('documente')[VW.doc];
  if (!r) { e.innerHTML = '<div class="vwgol"><p>Documentul nu are încă text.</p>' + barut('ocr', 'Transformă în text', 'pri') + '<p class="small mut">Durează puțin. Poți închide fereastra și lucra mai departe.</p></div>'; return; }
  const n = Object.keys(r.pagini).length;
  const sus = e.scrollTop;
  e.innerHTML = (r.stare === 'gata' ? '' : '<div class="vwp small">' + (r.stare === 'eroare' ? '<b>Eroare:</b> ' + esc(r.eroare || '') : 'Se transcrie: ' + n + ' din ' + (r.total || '…') + ' pagini' + (OCR.activ === VW.doc && OCR.pct ? ' · pagina curentă ' + OCR.pct + '%' : '') + '. Poți închide fereastra.') + '</div>') +
    (Object.values(r.pagini).some((p) => p.conf != null && p.conf < 60) ? '<div class="vwp war small">Unele pagini sunt greu de citit. Verifică textul cu documentul alături.</div>' : '') +
    '<pre>' + esc(textDin(r)) + '</pre>';
  e.scrollTop = sus; void d;
}
async function continut(d) {
  const e = document.getElementById('vwd'); e.innerHTML = '<p class="vwgol mut">Se deschide…</p>';
  try {
    if (d.sters_la) {
      const ns = d.capturi || [];
      if (!ns.length) { e.innerHTML = '<div class="vwgol"><p><b>Fișierul a fost șters.</b></p><p class="mut small">A rămas textul.</p></div>'; VW.mod = 'text'; const b = document.querySelector('.vw .vwb'); if (b) b.dataset.mod = 'text'; return; }
      e.innerHTML = '<div class="vwp small">Fișierul a fost șters. Vezi capturile, păstrate până când textul e complet.</div>';
      for (const n of ns) { const b = await capturaPagina(d, n); if (b) { const i = new Image(); i.src = URL.createObjectURL(b); i.alt = 'Pagina ' + n; e.appendChild(i); } }
      return;
    }
    const url = await urlDoc(d), fel = felDoc(d);
    if (!url) { e.innerHTML = '<div class="vwgol"><p>Fișierul nu e disponibil pe acest dispozitiv.</p><p class="small mut">În modul demonstrativ se păstrează doar numele.</p></div>'; return; }
    if (fel === 'img') { e.innerHTML = ''; const i = new Image(); i.src = url; i.alt = d.nume; e.appendChild(i); return; }
    if (fel === 'txt') { const t = await (await fetch(url)).text(); e.innerHTML = '<pre>' + esc(t) + '</pre>'; return; }
    if (fel === 'pdf') {
      const pdf = await deschidePdf(url); e.innerHTML = '';
      const lat = Math.max(e.clientWidth - 24, 320);
      const ob = new IntersectionObserver((xs) => xs.forEach(async (x) => { if (!x.isIntersecting || x.target.dataset.gata) return; x.target.dataset.gata = '1'; const n = Number(x.target.dataset.n); const p = await pdf.getPage(n); const v1 = p.getViewport({ scale: 1 }); const c = await canvasPagina(pdf, n, Math.min(lat / v1.width * (window.devicePixelRatio || 1), 3)); c.style.width = '100%'; x.target.innerHTML = ''; x.target.appendChild(c); }), { root: e, rootMargin: '400px' });
      for (let n = 1; n <= pdf.numPages; n++) { const f = document.createElement('div'); f.className = 'vwf'; f.dataset.n = n; f.innerHTML = '<span class="small mut">Pagina ' + n + '</span>'; e.appendChild(f); ob.observe(f); }
      return;
    }
    e.innerHTML = '<div class="vwgol"><p>Tipul de fișier nu se poate previzualiza.</p><a class="b" href="' + url + '" download>Descarcă</a></div>';
  } catch (err) { console.error(err); e.innerHTML = '<div class="vwgol"><p>Documentul nu s-a putut deschide.</p><p class="small mut">' + esc(err.message) + '</p></div>'; }
}
function deschideDoc(id) { const d = D('documente')[id]; if (!d) { toast('Documentul nu e disponibil.'); return; } VW.doc = id; const r = ocrRec(id); VW.mod = d.sters_la && !(d.capturi || []).length ? 'text' : (r && r.stare === 'gata' ? 'alaturi' : 'doc'); const v = radacina(); v.innerHTML = ''; deseneazaVw(); }
function laClick(e) {
  const el = e.target.closest('[data-v]'); if (!el) return; e.stopPropagation(); const a = el.dataset.v;
  if (a === 'z') { VW.doc = null; deseneazaVw(); if (!typingNow()) renderApp(); return; }
  if (a.startsWith('m:')) { VW.mod = a.slice(2); deseneazaVw(); return; }
  if (a === 'ocr') { ocrPorneste(VW.doc); VW.mod = VW.mod === 'doc' ? 'alaturi' : VW.mod; deseneazaVw(); return; }
  const r = ocrRec(VW.doc), d = D('documente')[VW.doc];
  if (a === 'copie') navigator.clipboard.writeText(textDin(r)).then(() => toast('Text copiat.'));
  if (a === 'txt') dl(d.nume.replace(/\.[^.]+$/, '') + '.txt', textDin(r), 'text/plain;charset=utf-8');
  if (a === 'sterge') stergeFisier(VW.doc);
}
/* progresul se scrie direct în pagină: nu redesenez aplicația la fiecare pagină transcrisă */
function actualizeazaOcr() {
  document.querySelectorAll('[data-ocrid]').forEach((e) => { const id = e.dataset.ocrid; const t = document.createElement('span'); t.innerHTML = ocrChip(id); if (t.firstChild) e.replaceWith(t.firstChild); });
  if (VW.doc) { const s = document.getElementById('vwst'); if (s) s.innerHTML = ocrChip(VW.doc); textul(); const r = ocrRec(VW.doc), d = D('documente')[VW.doc]; if (r && r.stare === 'gata') { if (d.sters_la) { VW.mod = 'text'; continut(d); } deseneazaVw(); } }
  let p = document.getElementById('ocrp');
  const rest = OCR.lista.length + (OCR.activ ? 1 : 0);
  if (!rest) { if (p) p.remove(); return; }
  if (!p) { p = document.createElement('div'); p.id = 'ocrp'; document.body.appendChild(p); p.addEventListener('click', () => { if (OCR.activ) deschideDoc(OCR.activ); }); }
  const r = OCR.activ && ocrRec(OCR.activ); p.textContent = 'Se transcrie' + (r ? ' ' + Object.keys(r.pagini).length + '/' + (r.total || '…') : '') + (rest > 1 ? ' · încă ' + (rest - 1) + ' în coadă' : '');
}

A.vfile = (d) => { deschideDoc(d.id); return false; };
A.optext = (d) => { ocrPorneste(d.id); toast('A pornit. Poți lucra mai departe.'); };
setInterval(reiaOcr, 20000);
window.addEventListener('load', () => setTimeout(reiaOcr, 1500));

/* verificarea extrasului CF: datele scrise la pasul de obținere, comparate cu textul citit din PDF */
function panouComparatie(t) {
  const cf1 = L('taskuri', (x) => x.linie === t.linie && x.k === 'cf1')[0];
  const d = L('documente', (x) => x.linie === t.linie && x.tip === 'extras_cf')[0];
  if (!cf1 || !d) return '';
  const r = ocrRec(d.id);
  if (!r || r.stare !== 'gata') return sec('Comparație cu extrasul', '<p class="small mut">' + (r && r.stare !== 'eroare' ? 'Textul se transcrie: ' + Object.keys(r.pagini).length + '/' + (r.total || '…') + '.' : 'Extrasul nu are încă text.') + '</p>' + (!r || r.stare === 'eroare' ? btn('optext', 'În text', { id: d.id, c: 'pri' }) : ''));
  const form = {}; cf1.fields.forEach((f) => (form[f.k] = f.val));
  const pdf = parseCF(textDin(r)); const dif = compara(form, pdf);
  const gasit = ['cf_nr', 'nr_cad', 'suprafata', 'sarcini'].filter((k) => pdf[k]);
  return sec('Comparație cu extrasul', !gasit.length ? '<p class="small mut">Nu am recunoscut câmpurile în text. Verifică direct în document.</p>' : dif.length ? '<ul class="al2">' + dif.map((x) => '<li class="rosu">' + esc(x) + '</li>').join('') + '</ul>' : '<p><span class="chip verde">se potrivește</span> <span class="small mut">' + gasit.map((k) => CAMPURI_FISA[k]).join(', ') + '</span></p>');
}
