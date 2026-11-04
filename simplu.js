/* DD Operare · versiunea simplă (2.0.0, 05.11.2026).
   Două roluri: Administrator și Specialist. Un singur drum: Plată → Preluare → Specialist → Raport → Client.
   Aceleași date și același motor ca versiunea completă (index.html); aici se schimbă doar ce se vede și cum se apasă.
   Se încarcă ultimul: înlocuiește renderApp și adaugă acțiunile cu prefixul „s”.
   Totul stă într-o funcție, ca numele de aici să nu se lovească de cele din versiunea completă. */
(() => {
const S = { tab: 'azi', o: null, t: null, f: 'toate', q: '', per: '', ca: null };
try { Object.assign(S, JSON.parse(sessionStorage.getItem('dd_simplu') || '{}')); } catch (e) { /* fără sessionStorage */ }
const sSave = () => { try { sessionStorage.setItem('dd_simplu', JSON.stringify(S)); } catch (e) { /* ignor */ } };

const eSpec = () => UI.role === 'specialist';
const extern = (t) => t.spec !== 'motor' && t.spec !== 'analist';
const intern = (t) => t.spec === 'analist';
const vii = (oid) => orderTasks(oid).filter((t) => t.stare !== 'anulat');
const internId = () => (L('specialisti', (s) => s.spec.includes('analist'))[0] || {}).id;
const laMine = (t) => { const s = D('specialisti')[t.specialist]; return !!s && s.spec.includes('analist'); };
const verificata = (o) => !!o.preluata_la || ['livrata', 'inchisa'].includes(o.stare);
const servicii = (o) => L('linii', (l) => l.comanda === o.id && !l.incl && l.stare !== 'anulat').map((l) => svName(l.svc)).join(', ');
const imobil = (o) => imoText(D('imobile')[o.imobile[0]] || {});
const oferitLui = (t) => (L('oferte', (x) => x.task === t.id && x.raspuns === 'deschisa')[0] || {}).spec;
const inLucru = (t) => ['disponibil', 'oferit', 'atribuit'].includes(t.stare);

/* ---------- drumul comenzii: aceleași cinci trepte, mereu ---------- */
function etape(o) {
  const ts = vii(o.id), ex = ts.filter(extern), inn = ts.filter(intern);
  const gata = (g) => g.filter((t) => t.stare === 'terminat').length;
  const pb = (g) => g.some((t) => PB_T.includes(t.stare) || slaInfo(t).stare === 'late');
  const p = platita(o), v = verificata(o);
  /* un singur punct curent până la preluare, chiar dacă motorul a oferit deja pasul */
  const grup = (g, fara) => !g.length ? fara : gata(g) === g.length ? 'ok' : pb(g) ? 'pb' : v && g.some(inLucru) ? 'act' : 'urm';
  const e = [
    { k: 'plata', n: 'Plată', st: p ? 'ok' : 'act', sub: p ? hhmm(o.plata_la) : 'se așteaptă' },
    { k: 'preluare', n: 'Preluare', st: v ? 'ok' : p ? 'act' : 'urm', sub: v ? (o.preluata_de || '') : '' },
    { k: 'spec', n: 'Specialist', st: grup(ex, v ? 'ok' : 'urm'), sub: ex.length ? gata(ex) + ' din ' + ex.length : 'nu e nevoie' },
    { k: 'raport', n: 'Raport', st: grup(inn, o.livrata_la ? 'ok' : 'urm'), sub: inn.length ? gata(inn) + ' din ' + inn.length : '' },
    { k: 'client', n: 'Client', st: o.livrata_la ? 'ok' : 'urm', sub: o.livrata_la ? hhmm(o.livrata_la) : '' }
  ];
  if (!e.some((x) => x.st === 'act' || x.st === 'pb')) { const i = e.findIndex((x) => x.st !== 'ok'); if (i >= 0) e[i].st = 'act'; }
  return e;
}
const UNDE = { plata: 'Așteaptă plata', preluare: 'De verificat', spec: 'La specialist', raport: 'Raport de pregătit', client: 'De trimis' };
function trepte(o, aici) {
  return '<ol class="stp">' + etape(o).map((e, i) => '<li class="' + e.st + (e.k === aici ? ' aici' : '') + '"><b>' + (e.st === 'ok' ? '✓' : e.st === 'pb' ? '!' : i + 1) + '</b><span>' + e.n + '</span><small>' + esc(e.k === aici ? 'aici ești' : e.sub || '') + '</small></li>').join('') + '</ol>';
}
function puncte(o) {
  const e = etape(o), c = e.find((x) => x.st === 'pb') || e.find((x) => x.st === 'act');
  return '<span class="pct">' + e.map((x) => '<i class="' + x.st + '"></i>').join('') + '</span><span class="pctt ' + (c && c.st === 'pb' ? 'rosu' : '') + '">' + (o.stare === 'anulata' ? 'Anulată' : c ? UNDE[c.k] + (c.st === 'pb' ? ' · problemă' : '') : 'Trimisă clientului') + '</span>';
}

/* ---------- ce are de făcut administratorul ---------- */
function urmeaza(o) {
  if (o.stare === 'anulata') return { txt: 'Comanda e anulată.' };
  if (!platita(o)) return { txt: 'Se așteaptă plata clientului.', sub: 'Nu ai nimic de făcut până când plata e confirmată.' };
  if (o.stare === 'inchisa') return { txt: 'Comanda e închisă.' };
  if (o.stare === 'livrata') return { txt: 'Trimisă clientului, ' + hhmm(o.livrata_la) + '.', a: 'inchide', id: o.id, lbl: 'Închide comanda', sec: true };
  if (!verificata(o)) return { txt: 'Verifică plata și comanda, apoi preia.', a: 'spreia', id: o.id, lbl: 'Totul e în regulă, preiau' };
  const ts = vii(o.id).filter((t) => t.spec !== 'motor');
  const pb = ts.find((t) => PB_T.includes(t.stare));
  if (pb) return { rosu: true, txt: 'Problemă la „' + pb.n + '”', sub: TXT[pb.stare] || pb.stare, a: 'st', id: pb.id, lbl: 'Rezolvă' };
  const al = ts.find((t) => inLucru(t) && (intern(t) || (t.stare === 'atribuit' && laMine(t))));
  if (al) return { txt: 'Rândul tău: ' + al.n, a: 'st', id: al.id, lbl: 'Deschide pasul' };
  const lib = ts.find((t) => extern(t) && t.stare === 'disponibil');
  if (lib) return { txt: '„' + lib.n + '” nu are încă specialist.', a: 'st', id: lib.id, lbl: 'Trimite la specialist' };
  const sp = ts.find((t) => extern(t) && ['oferit', 'atribuit'].includes(t.stare));
  if (sp) return { txt: 'La specialist: ' + sp.n, sub: sp.stare === 'atribuit' ? spName(sp.specialist) + ' lucrează din ' + hhmm(sp.acceptat_la) : 'Așteaptă să accepte ' + spName(oferitLui(sp)), a: 'st', id: sp.id, lbl: 'Vezi pasul', sec: true };
  return { txt: 'Pașii automați rulează.', sub: 'Nu ai nimic de făcut acum.' };
}
function randulTau() {
  const q = [], nr = (oid) => (D('comenzi')[oid] || {}).nr || '';
  L('taskuri', (t) => t.spec !== 'motor' && PB_T.includes(t.stare)).forEach((t) => q.push({ p: 1, c: 'rosu', et: 'Problemă', ce: t.n, sub: nr(t.comanda) + ' · ' + (TXT[t.stare] || t.stare), a: 'st', id: t.id, lbl: 'Rezolvă' }));
  intrebariDeschise().forEach((m) => q.push({ p: 2, c: 'galben', et: 'Întrebare de la client', ce: m.text.slice(0, 80), sub: nr(m.comanda) + ' · ' + hhmm(m.la), a: 'so', id: m.comanda, lbl: 'Răspunde' }));
  L('comenzi', (o) => platita(o) && !verificata(o) && o.stare !== 'anulata').sort((a, b) => a.plata_la - b.plata_la).forEach((o) => q.push({ p: 3, c: 'galben', et: 'Comandă nouă', ce: servicii(o), sub: o.nr + ' · plătită ' + hhmm(o.plata_la), a: 'so', id: o.id, lbl: 'Verifică' }));
  /* pașii unei comenzi încă neverificate nu intră în listă: întâi se verifică și se preia comanda */
  const ver = (t) => { const o = D('comenzi')[t.comanda]; return !!o && verificata(o); };
  L('taskuri', (t) => ver(t) && inLucru(t) && (intern(t) || (t.stare === 'atribuit' && extern(t) && laMine(t)))).forEach((t) => q.push({ p: 4, c: '', et: 'Raport', ce: t.n, sub: nr(t.comanda), a: 'st', id: t.id, lbl: 'Lucrează' }));
  L('taskuri', (t) => ver(t) && extern(t) && t.stare === 'disponibil').forEach((t) => q.push({ p: 5, c: '', et: 'Fără specialist', ce: t.n, sub: nr(t.comanda), a: 'st', id: t.id, lbl: 'Trimite' }));
  L('linii', (l) => l.stare === 'cerere').forEach((l) => q.push({ p: 6, c: '', et: 'Cerere de ofertă', ce: svName(l.svc), sub: nr(l.comanda), a: 'so', id: l.comanda, lbl: 'Vezi' }));
  return q.sort((a, b) => a.p - b.p);
}
const laSpecialisti = () => L('taskuri', (t) => extern(t) && ['oferit', 'atribuit'].includes(t.stare) && !laMine(t)).sort((a, b) => (a.acceptat_la || 0) - (b.acceptat_la || 0));

/* ---------- piese comune ---------- */
const sBtn = (a, txt, id, c, x) => '<button class="b ' + (c || '') + '" data-a="' + a + '" data-id="' + esc(id == null ? '' : id) + '"' + (x != null ? ' data-x="' + esc(x) + '"' : '') + '>' + txt + '</button>';
const gol = (t, s) => '<div class="gol2"><b>' + t + '</b>' + (s ? '<span>' + s + '</span>' : '') + '</div>';
const rand = (x) => '<div class="rd ' + (x.c || '') + '"><div><small>' + esc(x.et) + '</small><b>' + esc(x.ce) + '</b><span>' + esc(x.sub) + '</span></div>' + sBtn(x.a, x.lbl, x.id, 'pri') + '</div>';
const cardComanda = (o) => '<div class="oc" data-a="so" data-id="' + o.id + '"><div class="oc1"><b>' + o.nr + '</b>' + (o.urgent ? tag('urgent', 'rosu') : '') + '<span>' + hhmm(o.creata_la) + '</span></div><div class="oc2">' + esc(servicii(o) || '—') + '</div><div class="oc3">' + imobil(o) + ' · ' + esc(clName(o)) + '</div><div class="oc4">' + puncte(o) + '<span class="suma">' + (o.total ? lei(o.total) : '') + '</span></div></div>';
const acum = (u) => '<div class="acum ' + (u.rosu ? 'rosu' : '') + '"><small>Acum</small><b>' + esc(u.txt) + '</b>' + (u.sub ? '<span>' + esc(u.sub) + '</span>' : '') + (u.a ? sBtn(u.a, u.lbl, u.id, u.sec ? 'mare' : 'pri mare') : '') + '</div>';
const ceas = (t) => (t.stare === 'atribuit' && t.sla && !t.terta ? timer(t.acceptat_la + t.sla * MIN, t.sla) : '');

/* formularul unui pas: verifici, completezi, atașezi */
function formPas(t, ro) {
  const tid = t.id; let n = 0;
  const bloc = (titlu, gata, tot, body) => { n++; return '<section class="fb"><div class="fh"><b class="' + (gata >= tot ? 'ok' : '') + '">' + (gata >= tot ? '✓' : n) + '</b><h3>' + titlu + '</h3><span>' + gata + ' din ' + tot + '</span></div>' + body + '</section>'; };
  const dis = ro ? ' disabled' : '';
  const bife = t.check.length ? bloc('Verifică', t.check.filter((c) => c.ok).length, t.check.length, t.check.map((c, i) => '<label class="ck"><input type="checkbox" data-i="ck|' + tid + '|' + i + '"' + (c.ok ? ' checked' : '') + dis + '><span>' + esc(c.t) + '</span></label>').join('')) : '';
  const camp = (f, i) => '<label class="cp">' + esc(f.label) + (f.type === 'sel' ? '<select data-i="fd|' + tid + '|' + i + '"' + dis + '><option value="">alege…</option>' + f.opt.map((x) => '<option' + (f.val === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>' : f.type === 'textarea' ? '<textarea rows="3" data-i="fd|' + tid + '|' + i + '"' + dis + '>' + esc(f.val) + '</textarea>' : '<input type="' + (f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text') + '" inputmode="' + (f.type === 'number' ? 'decimal' : 'text') + '" data-i="fd|' + tid + '|' + i + '" value="' + esc(f.val) + '"' + dis + '>') + '</label>';
  const date = t.fields.length ? bloc('Completează', t.fields.filter((f) => f.val !== '' && f.val != null).length, t.fields.length, '<div class="cps">' + t.fields.map(camp).join('') + '</div>') : '';
  const fisier = (rf) => { const up = t.fisiere.filter((x) => x.tip === rf.tip); return '<div class="fs"><div><b>' + esc(rf.label) + '</b>' + (rf.req ? '' : ' <span class="mut small">opțional</span>') + '</div>' + (up.length ? '<div class="fsl">' + up.map((u) => (D('documente')[u.doc] ? docLinie(D('documente')[u.doc]) : esc(u.nume))).join('<br>') + '</div>' : '') + (ro ? '' : '<div class="fsb"><label class="b">Atașează<input type="file" hidden accept="application/pdf,image/*,text/plain" data-i="up|' + tid + '|' + rf.tip + '"></label><label class="b">Fă o poză<input type="file" hidden accept="image/*" capture="environment" data-i="up|' + tid + '|' + rf.tip + '"></label>' + (SYNC.on ? '' : '<a href="#" class="small mut" data-a="demof" data-id="' + tid + '" data-x="' + rf.tip + '">fișier de test</a>') + '</div>') + '</div>'; };
  const docs = t.reqFiles.length ? bloc('Atașează', t.reqFiles.filter((rf) => t.fisiere.some((x) => x.tip === rf.tip)).length, t.reqFiles.length, t.reqFiles.map(fisier).join('')) : '';
  return bife + date + docs + (!ro && !SYNC.on ? '<p class="small mut ctr"><a href="#" data-a="fill" data-id="' + tid + '">completează de test</a></p>' : '');
}
const dateDin = (t) => { const fs = t.fields.filter((f) => f.val !== '' && f.val != null); return fs.length ? '<div class="dts"><small>' + esc(t.n) + (t.terminat_la ? ' · ' + esc(spName(t.specialist)) + ', ' + hhmm(t.terminat_la) : '') + '</small><dl>' + fs.map((f) => '<dt>' + esc(f.label) + '</dt><dd>' + esc(f.val) + '</dd>').join('') + '</dl></div>' : ''; };
const problemeHtml = (t, pot) => { const ps = L('probleme', (p) => p.task === t.id && p.stare !== 'rezolvata'); return ps.length ? '<div class="acum rosu"><small>Problemă</small>' + ps.map((p) => '<b>' + esc(p.tip) + '</b><span>' + esc(p.descr) + '</span>' + (pot ? sBtn('prez', 'Am rezolvat-o', p.id, 'mare') : '')).join('') + (pot ? '' : '<span>Administratorul o rezolvă; până atunci pasul e oprit.</span>') + '</div>' : ''; };

/* ---------- Administrator ---------- */
function adminAzi() {
  const q = randulTau(), sp = laSpecialisti(), os = L('comenzi');
  const k = (f, n, l, c) => '<button class="kp ' + (c || '') + '" data-a="sfil" data-id="' + f + '"><b>' + n + '</b><span>' + l + '</span></button>';
  return '<h1>Azi</h1><div class="kps">' + k('noi', os.filter((o) => platita(o) && !verificata(o) && o.stare !== 'anulata').length, 'de verificat', 'galben') + k('lucru', os.filter((o) => platita(o) && verificata(o) && !inchisa(o)).length, 'în lucru') + k('pb', os.filter((o) => !inchisa(o) && areProblema(o.id)).length, 'probleme', 'rosu') + k('neplatite', os.filter((o) => !platita(o) && o.stare !== 'anulata').length, 'neplătite') + '</div>' +
    '<h2>Rândul tău <i>' + q.length + '</i></h2>' + (q.length ? q.map(rand).join('') : gol('Nimic de făcut acum.', 'Comenzile noi și pașii tăi apar aici.')) +
    '<h2>La specialiști <i>' + sp.length + '</i></h2>' + (sp.length ? sp.map((t) => '<div class="rd lin" data-a="st" data-id="' + t.id + '"><div><small>' + esc((D('comenzi')[t.comanda] || {}).nr || '') + '</small><b>' + esc(t.n) + '</b><span>' + (t.stare === 'atribuit' ? esc(spName(t.specialist)) + ' · lucrează din ' + hhmm(t.acceptat_la) : 'așteaptă să accepte ' + esc(spName(oferitLui(t)))) + '</span></div><div class="dr">' + ceas(t) + termen(t) + '</div></div>').join('') : gol('Niciun pas la specialiști.'));
}
const FILTRE = [['toate', 'Toate'], ['noi', 'De verificat'], ['lucru', 'În lucru'], ['pb', 'Probleme'], ['neplatite', 'Neplătite'], ['trimise', 'Trimise']];
function adminComenzi() {
  const zi = 86400000, d0 = new Date(now()).setHours(0, 0, 0, 0);
  let os = L('comenzi').sort((a, b) => b.creata_la - a.creata_la);
  const f = { noi: (o) => platita(o) && !verificata(o) && o.stare !== 'anulata', lucru: (o) => platita(o) && verificata(o) && !inchisa(o), pb: (o) => !inchisa(o) && areProblema(o.id), neplatite: (o) => !platita(o) && o.stare !== 'anulata', trimise: (o) => ['livrata', 'inchisa'].includes(o.stare) }[S.f];
  if (f) os = os.filter(f);
  if (S.per) os = os.filter((o) => o.creata_la >= (S.per === 'azi' ? d0 : now() - Number(S.per) * zi));
  if (S.q) { const q = S.q.toLowerCase(); os = os.filter((o) => (o.nr + ' ' + imobil(o) + ' ' + clName(o) + ' ' + servicii(o)).toLowerCase().includes(q)); }
  return '<h1>Comenzi <i>' + os.length + '</i></h1><input class="caut" data-s="q" placeholder="Caută număr, client, CF, adresă" value="' + esc(S.q || '') + '">' +
    '<div class="chs">' + FILTRE.map((x) => '<button class="' + (S.f === x[0] ? 'on' : '') + '" data-a="sfil" data-id="' + x[0] + '" data-x="1">' + x[1] + '</button>').join('') + '<select data-s="per">' + [['', 'Oricând'], ['azi', 'Azi'], ['7', '7 zile'], ['30', '30 de zile']].map((x) => '<option value="' + x[0] + '"' + (S.per === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
    (os.length ? os.map(cardComanda).join('') : gol('Nicio comandă aici.', 'Schimbă filtrul sau căutarea.'));
}
function verificare(o) {
  const pl = L('plati', (p) => p.comanda === o.id), cap = pl.filter((p) => p.stare === 'capturata'), cl = D('clienti')[o.client] || {}, im = D('imobile')[o.imobile[0]] || {};
  const r = (ok, t, s) => '<li class="' + (ok ? 'ok' : 'nu') + '"><b>' + (ok ? '✓' : '!') + '</b><div><span>' + t + '</span><small>' + s + '</small></div></li>';
  return '<ul class="vf">' + r(cap.length > 0, 'Plata', cap.length ? lei(cap.reduce((s, p) => s + p.suma, 0)) + ' · confirmată ' + hhmm(cap[0].capturata_la || o.plata_la) + (cap[0].tx ? ' · ' + esc(cap[0].tx) : '') : 'marcată plătită ' + hhmm(o.plata_la) + ', fără plată înregistrată aici') +
    r(o.acord === true, 'Acord de executare imediată', o.acord === true ? 'dat ' + hhmm(o.acord_la) : 'lipsește') +
    r(!!(im.cf || im.adresa), 'Imobil', imobil(o) || 'fără CF și fără adresă') +
    r(!!servicii(o), 'Ce se cere', esc(servicii(o)) || 'niciun serviciu') +
    r(!!cl.email, 'Client', esc(cl.nume || '') + (cl.email ? ' · ' + esc(cl.email) : ' · fără e-mail')) + '</ul>';
}
function areCF(o) { return L('linii', (l) => l.comanda === o.id && l.stare !== 'anulat' && ['cf', 'ident', 'rAp', 'rInt'].includes(l.svc)).length > 0; }
function areExplicatie(o) { return L('linii', (l) => l.comanda === o.id && l.stare !== 'anulat' && l.svc === 'expl').length > 0; }
function adaugaExplicatie(oid) {
  const o = D('comenzi')[oid]; if (!o || !areCF(o) || areExplicatie(o) || inchisa(o)) return;
  const ln = { id: uid('ln'), comanda: o.id, imobil: o.imobile[0], svc: 'expl', pret: 0, tip: 'plata', stare: 'platita', plata: null, incl: true };
  D('linii')[ln.id] = ln; ev('linie.adaugata', (UI.auth || {}).nume || 'admin', { k: 'linie', id: ln.id }, { svc: 'expl', fara_plata: true });
  genTasks([ln]); advance(); toast('Explicația CF a fost adăugată la comandă.');
}
function adminComanda(o) {
  const ts = vii(o.id), ex = ts.filter(extern), inn = ts.filter(intern), auto = ts.filter((t) => t.spec === 'motor'), docs = L('documente', (d) => d.comanda === o.id), pl = L('plati', (p) => p.comanda === o.id), cl = D('clienti')[o.client] || {};
  const pas = (t) => '<div class="ps" data-a="st" data-id="' + t.id + '"><div><b>' + esc(t.n) + '</b><span>' + (extern(t) ? esc(t.specialist ? spName(t.specialist) : SPEC[t.spec]) : 'tu') + '</span></div><div class="dr">' + termen(t) + chip(t.stare) + '</div></div>';
  const msg = toateMesajele().filter((m) => m.comanda === o.id);
  const u = urmeaza(o);
  return '<a class="inap" href="#" data-a="sback">‹ Comenzi</a><div class="tit"><h1>' + o.nr + '</h1>' + (o.urgent ? tag('urgent', 'rosu') : '') + '</div><p class="sub"><b>' + esc(servicii(o)) + '</b><br>' + imobil(o) + ' · ' + esc(clName(o)) + '</p>' + trepte(o) +
    (u.a === 'spreia' ? '<div class="acum"><small>Acum</small><b>' + esc(u.txt) + '</b>' + verificare(o) + sBtn('spreia', u.lbl, o.id, 'pri mare') + sBtn('scrie', 'Ceva nu e în regulă: scriu clientului', o.id, 'mare lnk') + '</div>' : acum(u)) +
    (!platita(o) && !SYNC.on && pl.some((p) => p.stare === 'initiata') ? '<p class="small mut ctr"><a href="#" data-a="pcap" data-id="' + pl.find((p) => p.stare === 'initiata').id + '">simulează plata (doar în demo)</a></p>' : '') +
    (ex.length ? '<h2>Specialist <i>' + ex.filter((t) => t.stare === 'terminat').length + ' din ' + ex.length + '</i></h2>' + ex.map(pas).join('') : '') +
    (inn.length ? '<h2>Raport <i>' + inn.filter((t) => t.stare === 'terminat').length + ' din ' + inn.length + '</i></h2>' + inn.map(pas).join('') : '') +
    (auto.length ? '<p class="small mut">Pași automați: ' + auto.filter((t) => t.stare === 'terminat').length + ' din ' + auto.length + ' gata.</p>' : '') +
    '<h2>Documente <i>' + docs.length + '</i></h2>' + (docs.length ? '<div class="cd">' + docs.map((d) => '<div class="dc">' + docLinie(d) + '<small>' + esc(D('taskuri')[d.task] ? D('taskuri')[d.task].n : '') + ' · ' + esc(spName(d.incarcat_de)) + (d.vizibil ? ' · la client' : '') + '</small></div>').join('') + '</div>' : gol('Niciun document încă.')) +
    '<h2>Date salvate</h2><div class="cd">' + (ts.filter((t) => t.spec !== 'motor').map(dateDin).join('') || '<p class="small mut">Datele completate la pași apar aici și rămân salvate pentru verificare.</p>') +
    (areCF(o) ? '<div class="opt"><div><b>Explicația CF</b><small>' + (areExplicatie(o) ? 'face parte din comandă' : 'nu e în comandă') + '</small></div>' + (areExplicatie(o) || inchisa(o) ? '' : sBtn('sexpl', 'Adaugă', o.id, '')) + '</div>' : '') + '</div>' +
    '<details class="cd" data-k="plata"><summary>Plată · ' + (o.total ? lei(o.total) : '—') + '</summary>' + (pl.length ? pl.map((p) => '<div class="dc">' + chip(p.stare) + ' ' + lei(p.suma) + '<small>' + hhmm(p.la) + ' · ' + esc(p.proc) + (p.tx ? ' · ' + esc(p.tx) : '') + (p.factura ? ' · factura ' + esc(p.factura.nr) : '') + '</small></div>').join('') : '<p class="small mut">Nicio plată înregistrată.</p>') + '</details>' +
    '<details class="cd" data-k="client"><summary>Client și mesaje' + (msg.length ? ' · ' + msg.length : '') + '</summary><p>' + esc(cl.nume || '') + '<br><span class="small mut">' + esc(cl.email || '') + (cl.tel ? ' · ' + esc(cl.tel) : '') + '</span></p>' + msg.map((m) => '<div class="ms ' + (m.de === 'client' ? 'cl' : '') + '"><small>' + esc(m.de) + ' · ' + hhmm(m.la) + '</small>' + esc(m.text) + '</div>').join('') + sBtn('scrie', 'Scrie clientului', o.id, '') + '</details>' +
    '<details class="cd" data-k="istoric"><summary>Istoric · ' + eventsOfOrder(o.id).length + ' înregistrări</summary><ul class="tl">' + eventsOfOrder(o.id).map(evLine).join('') + '</ul></details>';
}
function adminPas(t) {
  const o = D('comenzi')[t.comanda], eu = intern(t) || laMine(t), editabil = eu && t.stare === 'atribuit';
  const sp = L('specialisti', (s) => s.status === 'activ' && s.spec.includes(t.spec));
  let stare = '';
  if (t.stare === 'asteptare') stare = acum({ txt: 'Încă nu e rândul acestui pas.', sub: 'Se deschide singur când sunt gata pașii dinainte.' });
  else if (t.stare === 'terminat') stare = '<div class="acum ok"><small>Gata</small><b>' + esc(spName(t.specialist)) + ', ' + hhmm(t.terminat_la) + '</b></div>';
  else if (extern(t) && !eu) stare = '<div class="acum"><small>' + (t.stare === 'atribuit' ? 'La specialist' : 'Trimite la specialist') + '</small>' + (t.stare === 'atribuit' ? '<b>' + esc(spName(t.specialist)) + '</b><span>lucrează din ' + hhmm(t.acceptat_la) + ' ' + ceas(t) + '</span>' : t.stare === 'oferit' ? '<b>Oferit lui ' + esc(spName(oferitLui(t))) + '</b><span>Așteaptă să accepte. Îl poți da direct altcuiva:</span>' : '<b>Alege cine face pasul</b>') +
    (t.stare === 'atribuit' ? '' : '<div class="als">' + (sp.length ? sp.map((s) => '<button data-a="strimite" data-id="' + t.id + '" data-x="' + s.id + '"><b>' + esc(s.nume) + '</b><span>' + esc(s.uat || s.judete.join(', ')) + ' · ' + load(s) + ' în lucru</span></button>').join('') : '<span>Niciun specialist activ pentru ' + esc(SPEC[t.spec]) + '.</span>') + '</div>') +
    '<div class="btns">' + sBtn('opcopie', 'Copiază cererea', t.id, '') + sBtn('seu', 'Pun eu documentul', t.id, '') + (t.stare === 'atribuit' ? sBtn('retrage', 'Retrage', t.id, '') : '') + '</div></div>';
  const primit = documenteIntrare(t), dinainte = t.dep.map((id) => D('taskuri')[id]).filter((x) => x && x.spec !== 'motor').map(dateDin).join('');
  return '<a class="inap" href="#" data-a="sback">‹ ' + o.nr + '</a><div class="tit"><h1>' + esc(t.n) + '</h1></div><p class="sub">' + imobil(o) + '</p>' + trepte(o, extern(t) ? 'spec' : 'raport') + problemeHtml(t, true) + stare +
    (eu && (primit.length || dinainte) ? '<h2>Ce ai primit</h2><div class="cd">' + primit.map((d) => '<div class="dc">' + docLinie(d) + '<small>' + esc(D('taskuri')[d.task] ? D('taskuri')[d.task].n : '') + '</small></div>').join('') + dinainte + '</div>' : '') +
    (t.k === 'cf3' ? panouComparatie(t) : '') + formPas(t, !editabil) +
    (editabil ? '<div class="bar">' + sBtn('sfin', 'Gata, mai departe', t.id, 'pri mare') + '</div><p class="ctr small"><a href="#" class="mut" data-a="pbm" data-id="' + t.id + '">Am o problemă la acest pas</a></p>' : '');
}
function adminMai() {
  const rol = (n, cine, ce) => '<li><b>' + n + '</b><div><span>' + cine + '</span><small>' + ce + '</small></div></li>';
  return '<h1>Mai mult</h1><h2>Cine ce face</h2><ol class="cine">' + rol(1, 'Clientul', 'comandă și plătește pe site') + rol(2, 'Administratorul', 'verifică plata și comanda, apoi o preia') + rol(3, 'Specialistul', 'verifică, completează datele, atașează documentul și îl trimite înapoi') + rol(4, 'Administratorul', 'verifică ce a primit și pregătește raportul') + rol(5, 'Clientul', 'primește documentele, automat, după ultimul pas') + '</ol>' +
    (typeof cardNotificari === 'function' ? cardNotificari() : '') +
    '<h2>Versiunea completă</h2><div class="cd"><p>Conturi, specialiști, contracte, plăți și decont, setări, plan.</p><a class="b" href="index.html">Deschide versiunea completă</a></div>' +
    '<div class="btns">' + sBtn('logout', 'Ieși din cont', '', '') + '</div>';
}

/* ---------- Specialist ---------- */
function specCap() {
  const s = D('specialisti')[UI.spec]; if (!s) return '';
  return '<div class="spc"><div><b>' + esc(s.nume) + '</b><span>' + esc(SPEC[s.spec[0]]) + ' · ' + esc(s.judete.join(', ')) + '</span></div><label class="tura"><input type="checkbox" data-i="tura"' + (s.tura ? ' checked' : '') + '><span>' + (s.tura ? 'primesc comenzi' : 'în pauză') + '</span></label></div>' + (typeof cardNotificari === 'function' ? cardNotificari() : '');
}
const linieSpec = (t) => { const im = D('imobile')[t.imobil] || {}; return (im.cf ? 'CF ' + im.cf + ' · ' : '') + esc(im.adresa || '') + (im.adresa ? ', ' : '') + esc(im.uat || '') + (im.judet ? ', ' + esc(im.judet) : ''); };
function specNoi() {
  const of = L('oferte', (x) => x.spec === UI.spec && x.raspuns === 'deschisa').map((x) => D('taskuri')[x.task]).filter((t) => t && t.stare === 'oferit');
  return specCap() + '<h1>Comenzi noi <i>' + of.length + '</i></h1>' + (of.length ? of.map((t) => '<div class="of"><small>' + tNr(t) + (t.urgent ? ' · urgent' : '') + '</small><b>' + esc(t.n) + '</b><span>' + linieSpec(t) + '</span><div class="of2"><div><small>primești</small><b>' + lei(t.tarif) + '</b></div><div><small>timp de lucru</small><b>' + (t.sla ? fmtD(t.sla) : '—') + '</b></div></div><div class="btns">' + sBtn('sacc', 'Accept', t.id, 'pri mare') + sBtn('sref', 'Nu pot', t.id, 'mare') + '</div></div>').join('') : gol('Nicio comandă nouă.', 'Când apare una, primești notificare.'));
}
function specLucru() {
  const ts = L('taskuri', (t) => t.specialist === UI.spec && ['atribuit', 'blocat'].includes(t.stare));
  return '<h1>În lucru <i>' + ts.length + '</i></h1>' + (ts.length ? ts.map((t) => '<div class="rd lin" data-a="st" data-id="' + t.id + '"><div><small>' + tNr(t) + '</small><b>' + esc(t.n) + '</b><span>' + linieSpec(t) + '</span></div><div class="dr">' + ceas(t) + (t.stare === 'blocat' ? chip('blocat') : '') + '</div></div>').join('') : gol('Nimic în lucru.', 'Comenzile acceptate apar aici.'));
}
function specTrimise() {
  const ts = L('taskuri', (t) => t.specialist === UI.spec && t.stare === 'terminat').sort((a, b) => b.terminat_la - a.terminat_la).slice(0, 40);
  return '<h1>Trimise <i>' + ts.length + '</i></h1>' + (ts.length ? ts.map((t) => '<div class="rd lin" data-a="st" data-id="' + t.id + '"><div><small>' + tNr(t) + ' · ' + hhmm(t.terminat_la) + '</small><b>' + esc(t.n) + '</b><span>' + linieSpec(t) + '</span></div><div class="dr"><b>' + lei(t.tarif) + '</b></div></div>').join('') : gol('Încă nimic trimis.'));
}
function specPas(t) {
  const gata = t.stare === 'terminat', editabil = t.specialist === UI.spec && t.stare === 'atribuit';
  const tr = [['Primită', 'ok'], ['Verifici', gata ? 'ok' : 'act'], ['La administrator', gata ? 'ok' : 'urm']];
  return '<a class="inap" href="#" data-a="sback">‹ Înapoi</a><div class="tit"><h1>' + esc(t.n) + '</h1></div><p class="sub">' + tNr(t) + ' · ' + linieSpec(t) + '</p>' +
    '<ol class="stp">' + tr.map((x, i) => '<li class="' + x[1] + '"><b>' + (x[1] === 'ok' ? '✓' : i + 1) + '</b><span>' + x[0] + '</span><small>' + (x[1] === 'act' ? 'aici ești' : '') + '</small></li>').join('') + '</ol>' +
    '<div class="of2 cd"><div><small>primești</small><b>' + lei(t.tarif) + '</b></div><div><small>' + (gata ? 'trimis' : 'timp rămas') + '</small><b>' + (gata ? hhmm(t.terminat_la) : ceas(t) || '—') + '</b></div></div>' + problemeHtml(t, false) +
    formPas(t, !editabil) +
    (editabil ? '<div class="bar">' + sBtn('sfin', 'Trimite la administrator', t.id, 'pri mare') + '</div><p class="ctr small"><a href="#" class="mut" data-a="pbm" data-id="' + t.id + '">Am o problemă</a> · <a href="#" class="mut" data-a="ret" data-id="' + t.id + '">Nu pot continua</a></p>' : '');
}

/* ---------- cadru ---------- */
renderApp = function () {
  const app = $('#app'); if (!app) return;
  const coada = TOAST ? '<div id="toast" class="toast">' + esc(TOAST) + '</div>' : '';
  if (!UI.auth) { app.innerHTML = '<div class="s2">' + loginView() + '</div>' + coada; return; }
  const rol = UI.auth.rol, sef = ['admin', 'tehnic', 'operator'].includes(rol);
  if (!sef && rol !== 'specialist') { app.innerHTML = '<div class="s2"><div class="gol2"><b>Versiunea simplă e pentru Administrator și Specialist.</b><span><a href="index.html">Deschide versiunea completă</a></span></div></div>' + coada; return; }
  if (rol === 'specialist') { UI.role = 'specialist'; UI.spec = UI.auth.sid; } else if (S.ca && D('specialisti')[S.ca]) { UI.role = 'specialist'; UI.spec = S.ca; } else { UI.role = rol; S.ca = null; }
  const sp = eSpec(), taburi = sp ? [['noi', 'Noi'], ['lucru', 'În lucru'], ['trimise', 'Trimise']] : [['azi', 'Azi'], ['comenzi', 'Comenzi'], ['mesaje', 'Mesaje'], ['mai', 'Mai mult']];
  if (!taburi.some((x) => x[0] === S.tab)) S.tab = taburi[0][0];
  let t = S.t && D('taskuri')[S.t], o = S.o && D('comenzi')[S.o];
  if (sp && t && t.specialist !== UI.spec) { t = null; S.t = null; }
  if (sp) { o = null; S.o = null; }
  const corp = sp ? (t ? specPas(t) : { noi: specNoi, lucru: specLucru, trimise: specTrimise }[S.tab]()) : (t ? adminPas(t) : o ? adminComanda(o) : { azi: adminAzi, comenzi: adminComenzi, mesaje: () => '<h1>Mesaje</h1>' + cereriView(), mai: adminMai }[S.tab]());
  const nr = { azi: sp ? 0 : randulTau().length, mesaje: sp ? 0 : intrebariDeschise().length, noi: sp ? L('oferte', (x) => x.spec === UI.spec && x.raspuns === 'deschisa').length : 0, lucru: sp ? L('taskuri', (x) => x.specialist === UI.spec && ['atribuit', 'blocat'].includes(x.stare)).length : 0 };
  const deschise = [...document.querySelectorAll('details[data-k][open]')].map((d) => d.dataset.k);
  const lista = L('specialisti', (s) => !s.spec.includes('analist'));
  app.innerHTML = '<div class="s2"><header class="hd"><div class="br"><i></i><div><b>DD Operare</b><span>' + (sp ? 'Specialist' : 'Administrator') + ' · ' + esc(sp && D('specialisti')[UI.spec] ? D('specialisti')[UI.spec].nume : UI.auth.nume) + '</span></div></div>' +
    (sef ? '<div class="seg"><button class="' + (sp ? '' : 'on') + '" data-a="sca" data-id="">Administrator</button><button class="' + (sp ? 'on' : '') + '" data-a="sca" data-id="' + esc(S.ca || (lista[0] || {}).id || '') + '">Specialist</button></div>' : sBtn('logout', 'Ieși', '', 'mic')) + '</header>' +
    (sef && sp ? '<div class="caa">Vezi ca <select data-s="ca">' + lista.map((s) => '<option value="' + s.id + '"' + (s.id === UI.spec ? ' selected' : '') + '>' + esc(s.nume) + ' · ' + esc(SPEC[s.spec[0]]) + '</option>').join('') + '</select></div>' : '') +
    '<main>' + corp + '</main>' +
    '<nav class="tb">' + taburi.map((x) => '<button class="' + (S.tab === x[0] && !t && !o ? 'on' : '') + '" data-a="stab" data-id="' + x[0] + '">' + x[1] + (nr[x[0]] ? '<i>' + nr[x[0]] + '</i>' : '') + '</button>').join('') + '</nav></div>' +
    (MODAL ? '<div class="ov" data-a="mclose"><div class="md"><div class="mh"><h3>' + MODAL.title + '</h3>' + btn('mclose', '✕', { c: 'mic' }) + '</div><div class="mb">' + MODAL.html + '</div></div></div>' : '') + coada;
  deschise.forEach((k) => { const d = document.querySelector('details[data-k="' + k + '"]'); if (d) d.open = true; });
  if (sp && UI.knownOffers == null) UI.knownOffers = L('oferte', (x) => x.spec === UI.spec && x.raspuns === 'deschisa').map((x) => x.id);
  tickTimers(); sSave();
};

Object.assign(A, {
  stab: (d) => { S.tab = d.id; S.o = S.t = null; window.scrollTo(0, 0); if (d.id === 'mesaje' && typeof incarcaCereriApp === 'function' && CERERI_APP.rows == null) return incarcaCereriApp(); },
  so: (d) => { MODAL = null; if (!D('comenzi')[d.id]) { S.tab = 'mesaje'; S.o = S.t = null; return; } S.o = d.id; S.t = null; window.scrollTo(0, 0); },
  open: (d) => A.so(d),
  st: (d) => { const t = D('taskuri')[d.id]; if (!t) return; S.t = t.id; S.o = t.comanda; window.scrollTo(0, 0); if (!eSpec() && intern(t) && ['disponibil', 'oferit'].includes(t.stare) && internId()) forceAssign(t.id, internId()); },
  sback: () => { if (S.t && !eSpec()) S.t = null; else { S.t = null; S.o = null; } },
  sfil: (d) => { S.f = d.id; S.tab = 'comenzi'; S.o = S.t = null; },
  spreia: (d) => { const o = D('comenzi')[d.id]; if (!o || o.preluata_la) return; o.preluata_la = now(); o.preluata_de = (UI.auth || {}).nume || 'administrator'; ev('comanda.preluata', o.preluata_de, { k: 'comanda', id: o.id }, { verificat: ['plata', 'acord', 'imobil', 'servicii', 'client'], suma: o.total, acord: o.acord === true }); toast('Preluată. Pașii merg mai departe.'); },
  strimite: (d) => { forceAssign(d.id, d.x); toast('Trimis la ' + spName(d.x) + '.'); },
  seu: (d) => { if (internId()) forceAssign(d.id, internId()); },
  sacc: (d) => { if (!acceptTask(d.id, UI.spec)) toast('Oferta nu mai e valabilă.'); else { S.t = d.id; S.tab = 'lucru'; window.scrollTo(0, 0); } },
  sref: (d) => refuseTask(d.id, UI.spec, 'refuzat'),
  sfin: (d) => {
    const t = D('taskuri')[d.id]; const err = finishTask(d.id, eSpec() ? UI.spec : t.specialist);
    if (err.length) { openModal('Mai lipsește ceva', '<ul>' + err.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>'); return; }
    advance(); window.scrollTo(0, 0);
    if (eSpec()) { S.t = null; S.tab = 'trimise'; toast('Trimis la administrator.'); return; }
    const o = D('comenzi')[t.comanda], u = urmeaza(o);
    if (u.a === 'st' && !u.sec) { A.st({ id: u.id }); toast('Gata. Urmează: ' + D('taskuri')[u.id].n); } else { S.t = null; toast(o.stare === 'livrata' ? 'Comanda a plecat la client.' : 'Gata.'); }
  },
  sca: (d) => { S.ca = d.id || null; S.o = S.t = null; S.tab = d.id ? 'noi' : 'azi'; UI.knownOffers = null; },
  sexpl: (d) => adaugaExplicatie(d.id)
});
document.addEventListener('input', (e) => {
  if (!e.target.dataset || e.target.dataset.s !== 'q') return;
  S.q = e.target.value; const pos = e.target.selectionStart; renderApp();
  const n = document.querySelector('[data-s="q"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { /* fără selecție */ } }
});
document.addEventListener('change', (e) => {
  const k = e.target.dataset && e.target.dataset.s; if (k !== 'ca' && k !== 'per') return;
  if (k === 'ca') { S.ca = e.target.value; S.t = null; UI.knownOffers = null; } else S.per = e.target.value;
  renderApp();
});
window.S2 = { S, etape, urmeaza, randulTau };
})();
