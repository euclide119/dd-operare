/* Platforma de operare · sincronizare în timp real prin Supabase (conturi separate, realtime, fișiere).
   Se activează doar dacă există config.js cu EPAY_CFG = { supabaseUrl, supabaseKey } (cheia publică „anon”).
   Fără config, aplicația rulează în modul demonstrativ (date locale, conturi de test fără parole). */
'use strict';

const SYNC = { on: false, sb: null, user: null, prof: null, snap: {}, evSent: 0, timer: null, err: '', onchange: null };
const OBJ_COLS = ['clienti', 'imobile', 'comenzi', 'linii', 'taskuri', 'specialisti', 'oferte', 'plati', 'oferte_pret', 'documente', 'notificari', 'probleme', 'sugestii', 'tinte', 'contracte', 'fise', 'juridic', 'servicii', 'acte', 'dosare', 'ocr', 'intrebari'];
const META_KEYS = ['v', 'seq', 'settings', 'rr', 'cosuri', 'surse', 'asteptare', 'mesaje', 'planop'];
/* date despre clienți: stau în rândul meta/privat, pe care specialistul nu îl poate citi (meta/main rămâne comun) */
const META_PRIVAT = ['cosuri', 'asteptare', 'mesaje'];

const syncAvailable = () => !!(window.EPAY_CFG && window.EPAY_CFG.supabaseUrl && window.EPAY_CFG.supabaseKey && window.supabase);

async function syncInit() {
  if (!syncAvailable()) return false;
  SYNC.sb = window.supabase.createClient(window.EPAY_CFG.supabaseUrl, window.EPAY_CFG.supabaseKey);
  const { data } = await SYNC.sb.auth.getSession();
  if (data && data.session) { try { await afterLogin(data.session.user); } catch (e) { SYNC.err = e.message; } }
  return true;
}
async function syncLogin(email, pass) {
  const { data, error } = await SYNC.sb.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error('Email sau parolă greșite.');
  await afterLogin(data.user);
}
async function syncLogout() {
  if (SYNC.sb) await SYNC.sb.auth.signOut();
  /* la ieșire nu rămâne nimic pe dispozitiv: nici datele din memorie, nici capturile de pagini */
  if (SYNC.on) { try { R.db = emptyDb(); SYNC.snap = {}; indexedDB.deleteDatabase('dd_capturi'); sessionStorage.removeItem('epay_ui'); sessionStorage.removeItem('dd_simplu'); } catch (e) { /* ignor */ } }
  SYNC.on = false; SYNC.prof = null; SYNC.user = null;
}
async function afterLogin(user) {
  SYNC.user = user;
  const { data: p, error } = await SYNC.sb.from('profiluri').select('*').eq('user_id', user.id).single();
  if (error || !p) throw new Error('Contul nu are un rol în platformă. Cere adminului să-l adauge.');
  SYNC.prof = p;
  await syncLoad();
  SYNC.on = true;
  syncSubscribe();
}
async function syncLoad() {
  const db = emptyDb(); let from = 0;
  for (;;) {
    const { data, error } = await SYNC.sb.from('platforma_docs').select('col,id,data').range(from, from + 999);
    if (error) throw error;
    data.forEach((r) => { if (r.col === 'meta') META_KEYS.forEach((k) => { if (r.data[k] !== undefined) db[k] = r.data[k]; }); else if (db[r.col] && !Array.isArray(db[r.col])) db[r.col][r.id] = r.data; SYNC.snap[r.col + '/' + r.id] = JSON.stringify(r.data); });
    if (data.length < 1000) break; from += 1000;
  }
  const { data: evs } = await SYNC.sb.from('platforma_evenimente').select('data').order('id').limit(5000);
  db.evenimente = (evs || []).map((x) => x.data);
  SYNC.evSent = db.evenimente.length;
  R.db = db;
}
/* trimite doar ce s-a schimbat; rândurile respinse de RLS se ignoră (dispecerul de la admin le completează) */
async function syncPush() {
  if (!SYNC.on) return;
  if (SYNC.pushing) { SYNC.again = true; return; }
  SYNC.pushing = true;
  try {
    const rows = [];
    OBJ_COLS.forEach((col) => Object.values(R.db[col] || {}).forEach((d) => { const k = col + '/' + d.id; const s = JSON.stringify(d); if (SYNC.snap[k] !== s) rows.push({ col, id: d.id, data: d, k, s }); }));
    const admin = ['admin', 'tehnic', 'operator'].includes(SYNC.prof.rol);
    if (admin) [['main', META_KEYS.filter((k) => !META_PRIVAT.includes(k))], ['privat', META_PRIVAT]].forEach(([id, ks]) => { const m = {}; ks.forEach((k) => (m[k] = R.db[k])); const s = JSON.stringify(m); if (SYNC.snap['meta/' + id] !== s) rows.push({ col: 'meta', id, data: m, k: 'meta/' + id, s }); });
    const ts = new Date().toISOString();
    if (admin) {
      /* adminul are drept de insert + update: trimitem în pachete de câte 200 */
      for (let i = 0; i < rows.length; i += 200) {
        const part = rows.slice(i, i + 200);
        const { error } = await SYNC.sb.from('platforma_docs').upsert(part.map((r) => ({ col: r.col, id: r.id, data: r.data, updated_at: ts })), { onConflict: 'col,id' });
        if (error) { SYNC.err = 'Salvare eșuată: ' + error.message; break; }
        part.forEach((r) => (SYNC.snap[r.k] = r.s));
        if (SYNC.onprogress) SYNC.onprogress(Math.min(i + 200, rows.length), rows.length);
      }
    } else {
      for (const r of rows) {
        /* specialistul nu are drept de insert pe pași: update pentru rândurile existente, insert pentru cele noi */
        const known = r.k in SYNC.snap; let error;
        if (known) ({ error } = await SYNC.sb.from('platforma_docs').update({ data: r.data, updated_at: ts }).eq('col', r.col).eq('id', r.id));
        else { ({ error } = await SYNC.sb.from('platforma_docs').insert({ col: r.col, id: r.id, data: r.data, updated_at: ts })); if (error && /duplicate key/i.test(error.message)) ({ error } = await SYNC.sb.from('platforma_docs').update({ data: r.data, updated_at: ts }).eq('col', r.col).eq('id', r.id)); }
        SYNC.snap[r.k] = r.s; if (error && !/row-level security|Nepermis|protejat|nepermis/i.test(error.message)) SYNC.err = error.message;
      }
    }
    const evs = R.db.evenimente.slice(SYNC.evSent);
    for (let i = 0; i < evs.length; i += 500) { const { error } = await SYNC.sb.from('platforma_evenimente').insert(evs.slice(i, i + 500).map((e) => ({ data: e }))); if (error) break; SYNC.evSent += Math.min(500, evs.length - i); }
  } finally {
    SYNC.pushing = false;
    if (SYNC.again) { SYNC.again = false; syncSchedule(); }
  }
}
function syncSchedule() { clearTimeout(SYNC.timer); SYNC.timer = setTimeout(() => syncPush().catch((e) => (SYNC.err = e.message)), 250); }
function syncSubscribe() {
  SYNC.sb.channel('platforma').on('postgres_changes', { event: '*', schema: 'public', table: 'platforma_docs' }, (p) => {
    const r = p.new; if (!r || !r.col) return; const k = r.col + '/' + r.id; const s = JSON.stringify(r.data);
    if (SYNC.snap[k] === s) return; SYNC.snap[k] = s;
    if (r.col === 'meta') META_KEYS.forEach((x) => { if (r.data[x] !== undefined) R.db[x] = r.data[x]; }); else if (R.db[r.col] || r.col === 'dosare') { R.db[r.col] = R.db[r.col] || {}; R.db[r.col][r.id] = r.data; }
    if (SYNC.onchange) SYNC.onchange(r.col);
  }).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platforma_evenimente' }, (p) => {
    if (p.new.autor === SYNC.user.id) return; R.db.evenimente.push(p.new.data); SYNC.evSent++; if (SYNC.onchange) SYNC.onchange('evenimente');
  }).subscribe();
}
/* prima încărcare a datelor de test într-un proiect gol (doar admin) */
async function syncSeedRemote() {
  const on = SYNC.on; SYNC.on = false; seedAll(); SYNC.on = on;   /* seed local fără push intermediar */
  SYNC.snap = {}; SYNC.evSent = 0; await syncPush();
  if (SYNC.err) throw new Error(SYNC.err);
}
/* fișiere: încărcare în bucketul privat și link semnat pentru descărcare */
async function syncUpload(doc, file) {
  if (!SYNC.on || !file) return;
  const path = doc.comanda + '/' + doc.task + '/' + doc.id + '_' + file.name.replace(/[^\w.\-]+/g, '_');
  const { error } = await SYNC.sb.storage.from('documente').upload(path, file, { upsert: true, contentType: file.type });
  if (!error) { doc.path = path; syncSchedule(); } else SYNC.err = 'Încărcare eșuată: ' + error.message;
}
async function syncFileUrl(doc) { if (!SYNC.on || !doc.path) return null; const { data } = await SYNC.sb.storage.from('documente').createSignedUrl(doc.path, 600); return data ? data.signedUrl : null; }

/* LocalRepo.save → și Supabase, când e activ */
(function () { const orig = LocalRepo.prototype.save; LocalRepo.prototype.save = function () { if (SYNC.on) { syncSchedule(); return; } orig.call(this); }; })();
