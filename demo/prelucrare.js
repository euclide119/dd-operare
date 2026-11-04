/* Modulul de prelucrare a datelor: colecția de fișe (o fișă pe imobil) din datele completate de specialiști
   + textul extras din PDF-ul de CF, comparate între ele; export JSON/CSV; salvare în baza comună (colecția „fise”).
   Parserul e determinist (expresii regulate pe structura extrasului de informare). [E] — de validat pe primele extrase reale. */
'use strict';

/* ---------- extragerea textului din PDF (pdf.js, în browser) ---------- */
let PDFJS = null;
async function pdfLib() {
  if (PDFJS) return PDFJS;
  await new Promise((ok, err) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = ok; s.onerror = () => err(new Error('Nu s-a putut încărca cititorul de PDF (fără internet?).')); document.head.appendChild(s); });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return (PDFJS = window.pdfjsLib);
}
async function pdfText(src) {
  const lib = await pdfLib(); const doc = await lib.getDocument(src).promise; const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i); const c = await p.getTextContent(); let lastY = null, line = '';
    c.items.forEach((it) => { const y = Math.round(it.transform[5]); if (lastY !== null && Math.abs(y - lastY) > 2) { out.push(line); line = ''; } line += (line && !line.endsWith(' ') ? ' ' : '') + it.str; lastY = y; });
    out.push(line, '');
  }
  return out.join('\n');
}

/* ---------- parserul extrasului CF ---------- */
const initialeDin = (nume) => nume.split(/[\s\-]+/).filter((w) => w.length > 1).map((w) => w[0].toUpperCase() + '.').join('');
function parseCF(text) {
  const t = text.replace(/ /g, ' ').replace(/[ \t]+/g, ' ');
  const g = (re) => { const m = t.match(re); return m ? m[1].trim() : ''; };
  const sect = (from, to) => { const a = t.search(from); if (a < 0) return ''; const rest = t.slice(a); const b = to ? rest.slice(1).search(to) : -1; return b > 0 ? rest.slice(0, b + 1) : rest; };
  const p1 = sect(/Partea\s+I\b|PARTEA\s+I\b/, /Partea\s+II\b|PARTEA\s+II\b/), p2 = sect(/Partea\s+II\b|PARTEA\s+II\b/, /Partea\s+III\b|PARTEA\s+III\b/), p3 = sect(/Partea\s+III\b|PARTEA\s+III\b/, null);
  const r = {
    cf_nr: g(/Carte\s+Funciar[ăa]\s+Nr\.?\s*(\d{3,9}(?:-C\d+(?:-U\d+)?)?)/i),
    uat: g(/Carte\s+Funciar[ăa]\s+Nr\.?\s*\d[\d\-CU]*[ \t]+(?:Comuna\s*\/?\s*Ora[șs]\s*\/?\s*Municipiu\s*:?\s*)?([A-ZĂÂÎȘȚ][A-Za-zĂÂÎȘȚăâîșț\-]+(?:[ \t]+[A-ZĂÂÎȘȚ][A-Za-zăâîșț\-]+)?)/),
    nr_cad: g(/Nr\.?\s*cadastral\s*:?\s*([\d][\d\-\/]*(?:-C\d+)?)/i) || g(/\n\s*(\d{4,9})\s+(?:Teren|[\d.,]+\s*mp)/i),
    suprafata: g(/Suprafa[țt]a\s*(?:m[ăa]surat[ăa])?\s*(?:\*|\(mp\))?\s*:?\s*([\d][\d.,]*)\s*(?:mp)?/i).replace(/\.(?=\d{3}\b)/g, ''),
    adresa: g(/Adresa\s*:?\s*([^\n]{5,120})/i),
    zona: /extravilan/i.test(p1) ? 'extravilan' : /intravilan/i.test(p1) ? 'intravilan' : '',
    constructii: (p1.match(/\bC\d+\b/g) || []).filter((v, i, a) => a.indexOf(v) === i),
    data_eliberarii: g(/(?:eliberat|Data\s+eliber[ăa]rii)[^\d]{0,30}(\d{2}[./]\d{2}[./]\d{4})/i) || g(/(\d{2}[./]\d{2}[./]\d{4})/),
    tip_extras: /pentru\s+informare/i.test(t) ? 'informare' : /autentificare/i.test(t) ? 'autentificare' : '',
    proprietari: [], cote: [], sarcini: '', sarcini_tipuri: [], incheieri: []
  };
  /* proprietari: nume scrise cu majuscule în Partea II, transformate imediat în inițiale (fără nume complete în colecție) */
  const nume = (p2.match(/\b(?:\d+\)\s*)?([A-ZĂÂÎȘȚ]{2,}(?:[\s\-]+[A-ZĂÂÎȘȚ]{2,}){1,3})\b/g) || [])
    .map((s) => s.replace(/^\d+\)\s*/, '').trim())
    .filter((s) => !/^(PARTEA|NR|CF|ACT|INTABULARE|DREPT|PROPRIETATE|DOBANDIT|DOBÂNDIT|CONSTRUIRE|CUMPARARE|CUMPĂRARE|BUN|COMUN|PROPRIU|CONTRACT|ACTE|NOTARIAL|CERTIFICAT|MOSTENITOR|MOȘTENITOR|SUCCESIUNE|LEGE|OCPI|ANCPI|ROMANIA|ROMÂNIA|UAT|NUME)\b/.test(s));
  r.proprietari = nume.filter((v, i, a) => a.indexOf(v) === i).slice(0, 6).map(initialeDin);
  r.cote = (p2.match(/cot[ăa]\s*(?:actual[ăa]|parte)?\s*:?\s*(\d+\s*\/\s*\d+)/gi) || []).map((s) => s.replace(/.*?(\d+\s*\/\s*\d+)/, '$1').replace(/\s/g, ''));
  r.incheieri = (t.match(/[ÎI]ncheierea?\s*(?:nr\.?)?\s*(\d{2,7}\s*\/\s*\d{2}[./]\d{2}[./]\d{4})/gi) || []).map((s) => s.replace(/.*?(\d{2,7}\s*\/\s*\d{2}[./]\d{2}[./]\d{4})/, '$1').replace(/\s/g, ''));
  if (/NU\s+SUNT/i.test(p3) || /nu\s+exist[ăa]\s+sarcini/i.test(p3)) r.sarcini = 'nu';
  else if (p3.trim()) { r.sarcini = 'da'; ['ipotec', 'interdic', 'sechestru', 'litigi', 'servitu', 'concesiun', 'uzufruct', 'superfici', 'notare'].forEach((k) => { if (new RegExp(k, 'i').test(p3)) r.sarcini_tipuri.push(k); }); }
  return r;
}

/* ---------- colecția: o fișă pe imobil, din pașii specialiștilor ---------- */
const CAMPURI_FISA = { cf_nr: 'Nr. CF', uat: 'UAT', nr_cad: 'Nr. cadastral', suprafata: 'Suprafață (mp)', proprietari: 'Proprietari (inițiale)', cote: 'Cote', sarcini: 'Sarcini', acces: 'Acces drum', statut: 'Statut drum', suprafata_masurata: 'Suprafață măsurată', diferenta: 'Diferență față de acte', cui: 'CUI firmă', insolventa: 'Insolvență', dosare: 'Dosare OCPI în curs', nr_vecini: 'Nr. vecini' };
function fisaDinFormulare(imoId) {
  const f = {}; const surse = [];
  L('taskuri', (t) => t.imobil === imoId && t.stare === 'terminat').forEach((t) => t.fields.forEach((x) => { if (x.val !== '' && x.val != null && CAMPURI_FISA[x.k] && f[x.k] == null) { f[x.k] = x.val; surse.push(t.n + ' · ' + spName(t.specialist)); } }));
  return { campuri: f, surse: [...new Set(surse)] };
}
function compara(form, pdf) {
  const dif = []; const norm = (v) => String(v || '').replace(/[\s.]/g, '').replace(',', '.').toLowerCase();
  [['cf_nr', 'cf_nr'], ['nr_cad', 'nr_cad'], ['suprafata', 'suprafata'], ['sarcini', 'sarcini']].forEach(([a, b]) => {
    if (form[a] != null && pdf[b]) { if (a === 'suprafata' ? Math.abs(parseFloat(norm(form[a])) - parseFloat(norm(pdf[b]))) > 0.5 : norm(form[a]) !== norm(pdf[b])) dif.push(CAMPURI_FISA[a] + ': formular „' + form[a] + '” ≠ PDF „' + pdf[b] + '”'); }
  });
  return dif;
}
function colectie() {
  return L('imobile').map((im) => {
    const salvata = (R.db.fise || {})[im.id]; const fo = fisaDinFormulare(im.id);
    const docCF = L('documente', (d) => d.tip === 'extras_cf' && L('taskuri', (t) => t.id === d.task && t.imobil === im.id).length);
    const comenzi = [...new Set(L('linii', (l) => l.imobil === im.id).map((l) => (D('comenzi')[l.comanda] || {}).nr))].filter(Boolean);
    return { im, form: fo.campuri, surse: fo.surse, docCF, comenzi, salvata };
  }).filter((x) => Object.keys(x.form).length || x.salvata || x.docCF.length);
}
function fisaPentruBaza(x, pdf) {
  const pdfF = pdf || (x.salvata && x.salvata.pdf) || null;
  const dif = pdfF ? compara(x.form, pdfF) : [];
  return { id: x.im.id, imobil: { cf: x.im.cf, nr_cad: x.im.nr_cad, uat: x.im.uat, judet: x.im.judet, tip: x.im.tip, adresa: x.im.adresa }, comenzi: x.comenzi, formular: x.form, surse: x.surse, pdf: pdfF, diferente: dif, stare: !pdfF ? 'doar formular' : dif.length ? 'diferențe' : 'concordă', salvata_la: now(), de: (UI.auth || {}).nume || 'admin' };
}
function exportColectie(fmt) {
  const rows = colectie().map((x) => fisaPentruBaza(x));
  if (fmt === 'json') return JSON.stringify(rows, null, 1);
  const cols = ['cf', 'uat', 'judet', 'nr_cad', 'suprafata', 'proprietari', 'cote', 'sarcini', 'acces', 'comenzi', 'stare', 'diferente'];
  const val = (r, c) => c === 'cf' ? r.imobil.cf : c === 'uat' ? r.imobil.uat : c === 'judet' ? r.imobil.judet : c === 'comenzi' ? r.comenzi.join(' ') : c === 'stare' ? r.stare : c === 'diferente' ? r.diferente.join(' | ') : (r.formular[c] != null ? r.formular[c] : (r.pdf && r.pdf[c] != null ? [].concat(r.pdf[c]).join(' ') : ''));
  return [cols.join(';')].concat(rows.map((r) => cols.map((c) => '"' + String(val(r, c) == null ? '' : val(r, c)).replace(/"/g, '""') + '"').join(';'))).join('\n');
}
