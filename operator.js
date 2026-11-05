/* Operatorul: „De lucrat”, fluxul comenzii (ca la urmărirea unui colet), pasul de lucru, întrebările clienților, Plan operare.
   Cititorul de documente și transformarea în text sunt în cititor.js. Se încarcă după app.js și dosare.js. */
'use strict';

Object.assign(EV_TXT, { 'comanda.preluata': 'Preluată de operator', 'document.text': 'Transformat în text', 'document.sters': 'Fișier șters, textul rămâne' });

const ACTIVE_T = ['disponibil', 'oferit', 'escaladat', 'atribuit', 'blocat', 'esuat'];
const PB_T = ['blocat', 'esuat', 'escaladat'];
const inchisa = (o) => ['livrata', 'inchisa', 'anulata'].includes(o.stare);
const platita = (o) => !!o.plata_la;
const umane = (ts) => ts.filter((t) => t.spec !== 'motor');
const pornita = (oid) => umane(orderTasks(oid)).some((t) => t.specialist || t.stare === 'terminat');
const preluata = (o) => !!o.preluata_la || ['livrata', 'inchisa'].includes(o.stare);
const nepreluata = (o) => platita(o) && !inchisa(o) && !preluata(o);
const areProblema = (oid) => orderTasks(oid).some((t) => PB_T.includes(t.stare) || slaInfo(t).stare === 'late') || L('probleme', (p) => p.comanda === oid && p.stare !== 'rezolvata').length > 0;
/* întrebările venite de pe site sunt rânduri proprii, ca să nu se piardă când alt dispozitiv salvează lista de mesaje */
const toateMesajele = () => (R.db.mesaje || []).concat(Object.values(R.db.intrebari || {})).sort((a, b) => a.la - b.la);
const intrebariDeschise = () => { const u = {}; toateMesajele().forEach((m) => (u[m.comanda] = m)); return Object.values(u).filter((m) => m.de === 'client'); };

/* ce fel de pas e: se deduce din structură, nu dintr-o listă de ținut la zi */
function tipPas(t) {
  if (t.spec === 'motor') return 'automat';
  if (t.dep.length >= 2) return 'combinare';
  if (!t.reqFiles.length && t.dep.length) return 'verificare';
  return 'document';
}
const TIP_PAS = { automat: ['Automat', 'gri'], combinare: ['Combină documente', 'alb'], verificare: ['Verifică', 'alb'], document: ['Obține document', 'alb'] };
const tipChip = (t) => tag(TIP_PAS[tipPas(t)][0], TIP_PAS[tipPas(t)][1]);

/* ---------- fluxul comenzii ---------- */
function nivel(t, memo) {
  if (memo[t.id] != null) return memo[t.id];
  memo[t.id] = 0;
  const prev = t.dep.map((id) => D('taskuri')[id]).filter(Boolean).concat(...t.depLines.map((id) => L('taskuri', (x) => x.linie === id)));
  memo[t.id] = prev.length ? 1 + Math.max(...prev.map((x) => nivel(x, memo))) : 0;
  return memo[t.id];
}
/* aceleași etape pentru orice comandă, ca la un colet: pașii sunt doar detaliul etapei */
function fluxComanda(oid) {
  const o = D('comenzi')[oid]; const om = umane(orderTasks(oid).filter((t) => t.stare !== 'anulat'));
  const memo = {}, combina = om.filter((t) => tipPas(t) === 'combinare'), prag = combina.length ? Math.min(...combina.map((t) => nivel(t, memo))) : Infinity;
  const din = (f) => om.filter((t) => nivel(t, memo) < prag && tipPas(t) === f);
  const st = [{ k: 'plata', n: platita(o) ? 'Plătită' : 'Plată', stare: platita(o) ? 'ok' : 'urm', la: o.plata_la, ts: [] }];
  st.push({ k: 'preluare', n: preluata(o) ? 'Preluată' : 'De preluat', stare: preluata(o) ? 'ok' : 'urm', la: o.preluata_la, sub: o.preluata_de || '', ts: [] });
  [['spec', 'La specialiști', din('document')], ['verif', 'Verificare', din('verificare')], ['final', 'Document final', om.filter((t) => nivel(t, memo) >= prag)]].forEach(([k, n, g]) => {
    if (!g.length) return;
    const gata = g.filter((t) => t.stare === 'terminat').length;
    st.push({ k, n, stare: gata === g.length ? 'ok' : g.some((t) => PB_T.includes(t.stare) || slaInfo(t).stare === 'late') ? 'pb' : 'urm', ts: g, sub: gata + ' din ' + g.length, la: gata === g.length ? Math.max(...g.map((t) => t.terminat_la || 0)) : null });
  });
  st.push({ k: 'livrare', n: 'Trimisă clientului', stare: o.livrata_la ? 'ok' : 'urm', la: o.livrata_la, ts: [] });
  /* un singur punct curent: prima etapă neterminată */
  const prima = st.findIndex((s) => s.stare !== 'ok');
  if (prima >= 0 && st[prima].stare === 'urm') st[prima].stare = 'cur';
  return st;
}
function fluxMini(oid) {
  const st = fluxComanda(oid), c = st.find((s) => s.stare !== 'ok');
  return '<span class="mini">' + st.map((s) => '<i class="' + s.stare + '"></i>').join('') + '</span> <span class="small">' + esc(c ? c.n : 'Gata') + (c && c.sub && c.ts.length ? ' · ' + esc(c.sub) : '') + '</span>';
}
const ICON = { ok: '✓', cur: '●', pb: '!', urm: '' };
function fluxHtml(oid, opt) {
  opt = opt || {}; const st = fluxComanda(oid);
  const aici = opt.task ? st.findIndex((s) => s.ts.some((t) => t.id === opt.task)) : -1;
  const cur = st.findIndex((s) => s.stare === 'cur' || s.stare === 'pb');
  const apasat = UI.fluxSt && UI.fluxSt.o === oid && st[UI.fluxSt.i];
  const ales = apasat ? UI.fluxSt.i : aici >= 0 ? aici : cur;
  const bare = st.map((s, i) => '<li class="' + s.stare + (i === ales ? ' sel' : '') + (i === aici ? ' aici' : '') + '" data-a="fluxst" data-id="' + oid + '|' + i + '"><b>' + (ICON[s.stare] || i + 1) + '</b><span>' + esc(s.n) + '</span><small>' + (i === aici ? 'aici ești' : s.la ? hhmm(s.la) : s.sub ? esc(s.sub) : '') + '</small></li>').join('');
  const s = st[ales]; let det = '';
  /* în pagina pasului, restul pașilor apar doar dacă apeși o etapă */
  if (s && (apasat || aici < 0)) {
    const rand = (t) => '<li><span class="p1">' + esc(t.n) + '</span><span class="p2">' + (opt.spec ? chip(t.stare) : (t.specialist ? esc(spName(t.specialist)) : t.spec === 'motor' ? 'automat' : esc(SPEC[t.spec])) + ' ' + chip(t.stare) + ' ' + termen(t) + (t.spec !== 'motor' && t.stare !== 'terminat' && t.stare !== 'asteptare' ? ' ' + btn('oppas', 'Lucrează', { id: t.id, c: 'mic pri' }) : t.spec !== 'motor' && t.stare === 'terminat' ? ' ' + btn('oppas', 'Vezi', { id: t.id, c: 'mic' }) : '')) + '</span></li>';
    const auto = orderTasks(oid).filter((t) => t.spec === 'motor' && t.stare !== 'anulat'), om = umane(s.ts).sort((a, b) => ACTIVE_T.indexOf(b.stare) - ACTIVE_T.indexOf(a.stare));
    det = (om.length ? '<ul class="awbd">' + om.map(rand).join('') + '</ul>' : '') + (auto.length && !opt.spec ? '<p class="small mut">Pași automați: ' + auto.filter((t) => t.stare === 'terminat').length + ' din ' + auto.length + ' gata.</p>' : '') + (!s.ts.length ? '<p class="small mut">' + (s.k === 'plata' ? (platita(D('comenzi')[oid]) ? 'Plata e confirmată.' : 'Se așteaptă plata clientului.') : s.k === 'preluare' ? (preluata(D('comenzi')[oid]) ? 'Comanda e preluată' + (s.sub ? ' de ' + esc(s.sub) : '') + '.' : 'Nimeni nu a preluat încă această comandă.') : D('comenzi')[oid].livrata_la ? 'Documentele au ajuns la client.' : 'Se trimite după ultimul pas.') + '</p>' : '');
  }
  return '<div class="awbw"><ol class="awb">' + bare + '</ol>' + det + '</div>';
}
/* un singur buton: ce are de făcut operatorul la comanda asta acum */
function pasulUrmator(o) {
  if (o.stare === 'anulata') return { txt: 'Comanda e anulată.' };
  if (!platita(o)) return { txt: 'Se așteaptă plata clientului.' };
  if (o.stare === 'inchisa') return { txt: 'Comanda e închisă.' };
  if (o.stare === 'livrata') return { txt: 'Livrată clientului.', a: 'inchide', id: o.id, lbl: 'Închide comanda' };
  if (o.gata_la && !o.livrata_la) return { txt: 'Toți pașii sunt gata. Verifică documentele și trimite.', a: 'optrimite', id: o.id, lbl: 'Trimite clientului' };
  if (!preluata(o)) return { txt: 'Comandă nouă. Vezi ce se cere și preia-o.', a: 'oppreia', id: o.id, lbl: 'Preiau comanda' };
  const ts = umane(orderTasks(o.id)); const pb = ts.find((t) => PB_T.includes(t.stare));
  if (pb) return { txt: 'Are nevoie de tine: ' + pb.n + ' (' + (TXT[pb.stare] || pb.stare) + ')', a: 'oppas', id: pb.id, lbl: 'Rezolv', rosu: true };
  const lucru = ts.find((t) => ['disponibil', 'oferit'].includes(t.stare)) || ts.find((t) => t.stare === 'atribuit');
  if (lucru) return { txt: 'Pasul de acum: ' + lucru.n + (lucru.specialist ? ' · la ' + spName(lucru.specialist) : ''), a: 'oppas', id: lucru.id, lbl: 'Deschid pasul' };
  return { txt: 'Lucrează pașii automați.' };
}
function urmatorHtml(o) {
  const p = pasulUrmator(o);
  return '<div class="urmb ' + (p.rosu ? 'rosu' : '') + '"><span>' + esc(p.txt) + '</span>' + (p.a ? btn(p.a, p.lbl, { id: p.id, c: 'pri' }) : '') + '</div>';
}

/* ---------- „De lucrat”: o singură coadă, în ordinea urgenței ---------- */
function coada() {
  const q = [], nr = (oid) => (D('comenzi')[oid] || {}).nr || '';
  const add = (prio, cls, ce, sub, a, id, lbl) => q.push({ prio, cls, ce, sub, a, id, lbl });
  L('taskuri', (t) => t.spec !== 'motor' && PB_T.includes(t.stare)).forEach((t) => add(1, 'rosu', t.n + ': ' + (TXT[t.stare] || t.stare), nr(t.comanda), 'oppas', t.id, 'Rezolv'));
  L('taskuri', (t) => slaInfo(t).stare === 'late').forEach((t) => add(2, 'rosu', t.n + ': termen depășit', nr(t.comanda) + ' · ' + spName(t.specialist), 'oppas', t.id, 'Deschid'));
  intrebariDeschise().forEach((m) => add(3, 'galben', 'Întrebare: ' + m.text.slice(0, 70), nr(m.comanda) + ' · ' + hhmm(m.la), 'nav', 'cereri', 'Răspund'));
  L('comenzi', nepreluata).sort((a, b) => a.plata_la - b.plata_la).forEach((o) => add(4, 'galben', 'Comandă nouă: ' + L('linii', (l) => l.comanda === o.id && !l.incl && l.stare !== 'anulat').map((l) => svName(l.svc)).join(', '), o.nr + ' · plătită ' + hhmm(o.plata_la), 'oppreia', o.id, 'Preiau'));
  L('comenzi', (o) => o.gata_la && !o.livrata_la && o.stare !== 'anulata').forEach((o) => add(4, 'galben', 'Completă: de verificat și trimis', o.nr, 'open', o.id, 'Deschid'));
  L('linii', (l) => l.stare === 'cerere').forEach((l) => add(5, '', 'De cotat: ' + svName(l.svc), nr(l.comanda), 'open', l.comanda, 'Deschid'));
  L('taskuri', (t) => t.spec === 'analist' && ['disponibil', 'oferit', 'atribuit'].includes(t.stare)).forEach((t) => add(6, '', t.n, nr(t.comanda) + ' · ' + TIP_PAS[tipPas(t)][0].toLowerCase(), 'oppas', t.id, 'Lucrez'));
  L('taskuri', (t) => slaInfo(t).stare === 'warn').forEach((t) => add(7, '', t.n + ': aproape de termen', nr(t.comanda) + ' · ' + spName(t.specialist), 'oppas', t.id, 'Deschid'));
  return q.sort((a, b) => a.prio - b.prio);
}
function indicatori() {
  const os = L('comenzi'), d0 = new Date(now()).setHours(0, 0, 0, 0);
  return [
    ['noi', 'noi de preluat', os.filter(nepreluata).length, 'galben'],
    ['lucru', 'în lucru', os.filter((o) => platita(o) && !inchisa(o) && preluata(o)).length, ''],
    ['pb', 'cu probleme', os.filter((o) => !inchisa(o) && areProblema(o.id)).length, 'rosu'],
    ['neplatite', 'neplătite', os.filter((o) => !platita(o)).length, ''],
    ['platiteazi', 'plătite azi', os.filter((o) => o.plata_la >= d0).length, ''],
    ['livrate', 'livrate', os.filter((o) => o.stare === 'livrata').length, '']
  ];
}
const kpiFiltre = (activ) => '<div class="kpis sm">' + indicatori().map((k) => '<div class="kpi ' + (k[2] ? k[3] : '') + (activ === k[0] ? ' on' : '') + '" data-a="opf" data-id="' + k[0] + '"><b>' + k[2] + '</b><span>' + k[1] + '</span></div>').join('') + '</div>';
function deLucrat() {
  const q = coada(), p = q[0];
  const rand = (x) => '<li class="' + x.cls + '"><div><b>' + esc(x.ce) + '</b><br><span class="small mut">' + esc(x.sub) + '</span></div>' + btn(x.a, x.lbl, { id: x.id, c: 'pri mic' }) + '</li>';
  return '<h2>De lucrat</h2>' + kpiFiltre() +
    (p ? '<div class="card urmc ' + p.cls + '"><span class="small mut">Începe cu</span><h3>' + esc(p.ce) + '</h3><p class="small mut">' + esc(p.sub) + '</p>' + btn(p.a, p.lbl, { id: p.id, c: 'pri mare' }) + '</div>' : '<div class="card"><b>Nimic de făcut acum.</b> <span class="mut">Comenzile noi apar aici.</span></div>') +
    (q.length > 1 ? sec('Apoi (' + (q.length - 1) + ')', '<ul class="coada">' + q.slice(1).map(rand).join('') + '</ul>') : '');
}

/* ---------- filtrele listei de comenzi ---------- */
function filtreComenzi(os, F) {
  const zi = (s, sf) => { const d = new Date(s + 'T00:00:00'); return sf ? d.getTime() + ZI - 1 : d.getTime(); };
  if (F.dela) os = os.filter((o) => o.creata_la >= zi(F.dela));
  if (F.panala) os = os.filter((o) => o.creata_la <= zi(F.panala, true));
  if (F.tip) os = os.filter((o) => L('linii', (l) => l.comanda === o.id && l.stare !== 'anulat' && !l.incl && (l.svc === F.tip || (SV[l.svc] || [])[2] === F.tip)).length);
  if (F.plata) os = os.filter((o) => (F.plata === 'platita' ? platita(o) : F.plata === 'neplatita' ? !platita(o) : L('plati', (p) => p.comanda === o.id && p.stare === F.plata).length));
  if (F.semn === 'pb') os = os.filter((o) => !inchisa(o) && areProblema(o.id));
  if (F.semn === 'noi') os = os.filter(nepreluata);
  if (F.semn === 'lucru') os = os.filter((o) => platita(o) && !inchisa(o) && preluata(o));
  if (F.semn === 'platiteazi') { const d0 = new Date(now()).setHours(0, 0, 0, 0); os = os.filter((o) => o.plata_la >= d0); }
  if (F.cine) os = os.filter((o) => orderTasks(o.id).some((t) => t.specialist === F.cine && ACTIVE_T.includes(t.stare)));
  return os;
}
function filtreExtra(F) {
  const sel = (k, opts, ph) => '<select data-i="fc_' + k + '"><option value="">' + ph + '</option>' + opts.map((o) => '<option value="' + o[0] + '"' + (F[k] === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
  const grupe = [['raport', 'Rapoarte'], ['cf', 'CF'], ['zona', 'Zonă'], ['cu', 'Urbanism'], ['oferta', 'La ofertă']];
  const activ = Object.keys(F).some((k) => F[k]);
  return sel('tip', grupe, 'Tip') + sel('plata', [['platita', 'Plătite'], ['neplatita', 'Neplătite'], ['esuata', 'Plată eșuată'], ['rambursata', 'Rambursate']], 'Plată') +
    sel('cine', L('specialisti', (s) => !s.sistem).map((s) => [s.id, s.nume]), 'La cine') +
    '<label class="small mut">de la <input type="date" data-i="fc_dela" value="' + esc(F.dela || '') + '"></label><label class="small mut">până la <input type="date" data-i="fc_panala" value="' + esc(F.panala || '') + '"></label>' + (activ ? btn('opfr', 'Toate', { c: 'mic' }) : '');
}

/* ---------- pasul de lucru deschis de operator ---------- */
function copieCerere(t) {
  const o = D('comenzi')[t.comanda], im = D('imobile')[t.imobil] || {};
  return ['Comanda ' + o.nr + (o.urgent ? ' (urgent)' : ''), 'Pas: ' + t.n, 'Imobil: ' + (im.cf ? 'CF ' + im.cf + ', ' : '') + (im.adresa || '') + ', ' + (im.uat || '') + ', ' + (im.judet || ''), t.check.length ? 'De făcut:\n' + t.check.map((c) => '- ' + c.t).join('\n') : '', t.reqFiles.length ? 'De trimis înapoi: ' + t.reqFiles.map((f) => f.label).join(', ') : ''].filter(Boolean).join('\n');
}
function pasOperator(tid) {
  const t = D('taskuri')[tid]; if (!t) return '<p>Pasul nu mai e disponibil.</p>';
  const o = D('comenzi')[t.comanda]; const liber = ['disponibil', 'oferit', 'escaladat'].includes(t.stare);
  const sp = L('specialisti', (s) => s.status === 'activ' && s.spec.includes(t.spec));
  const pb = L('probleme', (p) => p.task === tid && p.stare !== 'rezolvata');
  const cine = t.spec === 'motor' ? '' : '<div class="card"><div class="ch"><h3>' + (liber ? 'Cine face pasul?' : 'La cine e') + '</h3>' + tipChip(t) + '</div><div class="btns"><select data-i="fa|' + tid + '"><option value="">' + (liber ? 'alege…' : esc(spName(t.specialist) || 'schimbă…')) + '</option>' + sp.map((s) => '<option value="' + s.id + '">' + esc(s.nume) + ' · ' + esc(SPEC[s.spec[0]]) + '</option>').join('') + '</select>' + btn('opcopie', 'Copiază cererea', { id: tid }) + (t.stare === 'escaladat' ? btn('requeue', 'Reîncearcă automat', { id: tid }) : '') + (t.stare === 'atribuit' ? btn('retrage', 'Retrage', { id: tid }) : '') + (t.stare === 'esuat' ? btn('retry', 'Reia automatul', { id: tid, c: 'pri' }) : '') + '</div>' + (liber ? '<p class="small mut">Alege cine face pasul. Poți lucra direct aici sau poți trimite cererea și pune aici documentul primit.</p>' : '') + '</div>';
  const pbs = pb.length ? '<div class="card war">' + pb.map((p) => '<b>' + esc(p.tip) + ':</b> ' + esc(p.descr) + ' ' + btn('prez', 'Rezolvată', { id: p.id, c: 'mic' })).join('<br>') + '</div>' : '';
  return '<div class="back" data-a="open" data-id="' + o.id + '">← ' + o.nr + '</div><h2>' + esc(t.n) + '</h2>' + fluxHtml(o.id, { task: tid }) + cine + pbs + ticket(tid, true);
}
function finPas(tid) {
  const t = D('taskuri')[tid]; const err = finishTask(tid, t.specialist);
  if (err.length) { openModal('Nu poți trimite mai departe', '<ul>' + err.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>'); return; }
  advance(); const o = D('comenzi')[t.comanda]; const p = pasulUrmator(o);
  if (p.a === 'oppas') { UI.view = 'pas'; UI.sel = p.id; UI.fluxSt = null; toast('Gata. Urmează: ' + D('taskuri')[p.id].n); } else { UI.view = 'detaliu'; UI.sel = o.id; toast(o.stare === 'livrata' ? 'Toți pașii sunt gata: comanda a plecat la client.' : 'Gata.'); }
}

/* ---------- întrebări și cereri ---------- */
const CERERI_APP = { rows: null, err: '' };
async function incarcaCereriApp() {
  if (!SYNC.on) { CERERI_APP.rows = []; return; }
  const { data, error } = await SYNC.sb.from('cereri').select('id,nr,tip,stare,date,comanda_id,creata_la').order('creata_la', { ascending: false }).limit(50);
  CERERI_APP.rows = data || []; CERERI_APP.err = error ? error.message : '';
}
function cereriView() {
  const ms = toateMesajele(), grup = {};
  ms.forEach((m) => (grup[m.comanda] = grup[m.comanda] || []).push(m));
  const fir = (oid) => { const g = grup[oid], o = D('comenzi')[oid] || {}; const asteapta = g[g.length - 1].de === 'client'; return '<div class="card fir ' + (asteapta ? 'nou2' : '') + '"><div class="ch"><h3><a href="#" data-a="open" data-id="' + oid + '">' + esc(o.nr || oid) + '</a> <span class="mut small">' + (o.client ? esc(clName(o)) : '') + '</span></h3>' + (asteapta ? tag('așteaptă răspuns', 'galben') : tag('răspuns', 'verde')) + '</div><ul class="tl">' + g.map((m) => '<li><time>' + hhmm(m.la) + '</time> <b>' + esc(m.de) + ':</b> ' + esc(m.text) + '</li>').join('') + '</ul><div class="frm1"><textarea rows="2" data-i="rsp|' + oid + '" placeholder="Răspunsul tău…">' + esc((UI.rsp || {})[oid] || '') + '</textarea>' + btn('oprsp', 'Trimite', { id: oid, c: 'pri' }) + '</div></div>'; };
  const ids = Object.keys(grup).sort((a, b) => { const la = (x) => grup[x][grup[x].length - 1]; return (la(b).de === 'client') - (la(a).de === 'client') || la(b).la - la(a).la; });
  const oferte = L('linii', (l) => l.stare === 'cerere');
  const app = CERERI_APP.rows || [];
  return '<h2>Întrebări și cereri</h2><div class="card info small">La comenzile de pe site, răspunsul pleacă pe e-mail din server. Comenzile de test rămân doar aici.</div>' +
    (ids.length ? ids.map(fir).join('') : '<p class="mut">Nicio întrebare de la clienți.</p>') +
    sec('Cereri de ofertă (' + oferte.length + ')', oferte.length ? '<ul class="coada">' + oferte.map((l) => '<li><div><b>' + esc(svName(l.svc)) + '</b><br><span class="small mut">' + esc((D('comenzi')[l.comanda] || {}).nr || '') + '</span></div>' + btn('open', 'Deschid', { id: l.comanda, c: 'mic pri' }) + '</li>').join('') + '</ul>' : '<p class="mut small">Nicio cerere de cotat.</p>') +
    sec('Din aplicația clientului (' + app.length + ')', CERERI_APP.err ? '<p class="small mut">' + esc(CERERI_APP.err) + '</p>' : CERERI_APP.rows === null ? '<p class="small mut">Se încarcă…</p>' : app.length ? '<ul class="coada">' + app.map((c) => '<li><div><b>' + esc(c.nr) + ' · ' + esc(c.tip.replace(/_/g, ' ')) + '</b> ' + tag(c.stare, c.stare === 'nou' ? 'galben' : 'gri') + '<br><span class="small mut">' + esc((c.date && (c.date.adresa || c.date.eticheta)) || '') + ' · ' + esc(new Date(c.creata_la).toLocaleDateString('ro-RO')) + '</span></div>' + (c.stare === 'nou' ? btn('opcerere', 'Preiau', { id: c.id, c: 'mic pri' }) : '') + '</li>').join('') + '</ul>' : '<p class="mut small">Nicio cerere din aplicație.</p>');
}

/* ---------- Plan operare ---------- */
const stPlan = (it) => { const v = (R.db.planop || {})[it.id]; return v == null ? !!it.ok : v; };
function planOperare() {
  const f = UI.f.po || 'tot', ch = PLAN_OPERARE.capitole; const fac = (c) => { const n = c.items.length, g = c.items.filter(stPlan).length; return [g, n]; };
  const stare = (c) => { const [g, n] = fac(c); return g === n ? 'ok' : g ? 'cur' : 'urm'; };
  const curent = ch.findIndex((c) => stare(c) !== 'ok'); const ales = UI.f.poCap != null && ch[UI.f.poCap] ? UI.f.poCap : Math.max(curent, 0);
  const bare = ch.map((c, i) => { const [g, n] = fac(c); const s = stare(c) === 'urm' && i === curent ? 'cur' : stare(c); return '<li class="' + s + (i === ales ? ' sel' : '') + '" data-a="pocap" data-id="' + i + '"><b>' + (s === 'ok' ? '✓' : i + 1) + '</b><span>' + esc(c.t) + '</span><small>' + g + '/' + n + '</small></li>'; }).join('');
  const c = ch[ales]; const fil = [['tot', 'Toate'], ['bifa', 'De bifat'], ['rezolva', 'De rezolvat'], ['neclar', 'Neclare']];
  const toate = ch.flatMap((x) => x.items); const nr = (k) => toate.filter((i) => i.tip === k && !stPlan(i)).length;
  const it = (i) => '<li class="' + (stPlan(i) ? 'gata' : '') + '"><label><input type="checkbox" data-i="po|' + i.id + '"' + (stPlan(i) ? ' checked' : '') + '> <span>' + tag({ bifa: 'de bifat', rezolva: 'de rezolvat', neclar: 'neclar' }[i.tip], { bifa: 'alb', rezolva: 'rosu', neclar: 'galben' }[i.tip]) + ' ' + esc(i.t) + (i.d ? '<br><span class="small mut">' + esc(i.d) + '</span>' : '') + '</span></label></li>';
  const list = (f === 'tot' ? c.items : toate).filter((i) => f === 'tot' || i.tip === f);
  return '<h2>Plan operare <span class="mut small">actualizat ' + esc(PLAN_OPERARE.actualizat) + '</span></h2><div class="awbw"><ol class="awb">' + bare + '</ol></div><div class="filt">' + fil.map((x) => btn('pof', x[1] + (x[0] !== 'tot' ? ' · ' + nr(x[0]) : ''), { id: x[0], c: f === x[0] ? 'pri mic' : 'mic' })).join('') + '</div>' +
    sec(f === 'tot' ? esc(c.t) : fil.find((x) => x[0] === f)[1], (f === 'tot' && c.d ? '<p class="mut small">' + esc(c.d) + '</p>' : '') + '<ul class="pop">' + list.map(it).join('') + '</ul>') +
    '<details class="card"><summary>Arhitectura</summary><ul class="pop2">' + PLAN_OPERARE.arhitectura.map((a) => '<li><b>' + esc(a[0]) + ':</b> ' + esc(a[1]) + '</li>').join('') + '</ul></details>';
}

/* ---------- acțiuni ---------- */
Object.assign(A, {
  fluxst: (d) => { const [o, i] = d.id.split('|'); UI.fluxSt = { o, i: Number(i) }; },
  oppas: (d) => { UI.view = 'pas'; UI.sel = d.id; UI.fluxSt = null; MODAL = null; },
  oppreia: (d) => { const o = D('comenzi')[d.id]; o.preluata_la = now(); o.preluata_de = (UI.auth || {}).nume || 'operator'; ev('comanda.preluata', 'operator', { k: 'comanda', id: o.id }, {}); UI.view = 'detaliu'; UI.sel = o.id; UI.fluxSt = null; },
  opcopie: async (d) => { const t = D('taskuri')[d.id]; try { await navigator.clipboard.writeText(copieCerere(t)); toast('Cererea e copiată. O poți lipi în mesaj.'); } catch (e) { openModal('Cererea pentru specialist', '<textarea rows="9" style="width:100%">' + esc(copieCerere(t)) + '</textarea>'); } },
  opfin: (d) => finPas(d.id),
  optrimite: (d) => { if (trimiteClient(d.id, (UI.auth || {}).nume)) toast('Comanda a plecat la client.'); },
  opf: (d) => { UI.view = 'comenzi'; UI.sel = null; UI.f.c = d.id === 'neplatite' ? { plata: 'neplatita' } : d.id === 'livrate' ? { etapa: 'livrata' } : { semn: d.id }; },
  opfr: () => { UI.f.c = {}; },
  oprsp: (d) => { const txt = ((UI.rsp || {})[d.id] || '').trim(); if (!txt) { toast('Scrie răspunsul.'); return; } R.db.mesaje.push({ comanda: d.id, de: 'echipă', text: txt, la: now() }); const o = D('comenzi')[d.id]; const n = { id: uid('nt'), dest: 'client', comanda: d.id, canal: 'email', sablon: 'manual', subj: 'Mesaj de la echipă (' + o.nr + ')', body: txt, la: now(), stare: o.din_site ? 'de trimis' : 'trimis (simulat)', eroare: '' }; D('notificari')[n.id] = n; UI.rsp[d.id] = ''; toast(o.din_site ? 'Răspunsul pleacă pe e-mail în maximum un minut.' : 'Răspuns salvat (comandă de test).'); },
  opcerere: async (d) => { const { error } = await SYNC.sb.from('cereri').update({ stare: 'in_lucru' }).eq('id', d.id); if (error) toast(error.message); await incarcaCereriApp(); },
  pocap: (d) => { UI.f.poCap = Number(d.id); UI.f.po = 'tot'; },
  pof: (d) => { UI.f.po = d.id; }
});
const navVechi = A.nav;
A.nav = (d) => { if (d.id === 'cereri') { CERERI_APP.rows = null; incarcaCereriApp().then(() => { if (UI.view === 'cereri' && !typingNow()) renderApp(); }); } return navVechi(d); };
document.addEventListener('input', (e) => { const k = e.target.dataset && e.target.dataset.i; if (k && k.startsWith('rsp|')) { UI.rsp = UI.rsp || {}; UI.rsp[k.slice(4)] = e.target.value; } });
document.addEventListener('change', (e) => { const k = e.target.dataset && e.target.dataset.i; if (k && k.startsWith('po|')) { R.db.planop = R.db.planop || {}; R.db.planop[k.slice(3)] = e.target.checked; if (UI.f.poCap == null) UI.f.poCap = PLAN_OPERARE.capitole.findIndex((c) => c.items.some((i) => i.id === k.slice(3))); R.save(); renderApp(); } });

/* legătură directă: …/platforma/#/plan-operare */
function ruta() { if (location.hash === '#/plan-operare' && UI.auth && ['admin'].includes(UI.auth.rol)) { UI.role = 'admin'; UI.view = 'planop'; renderApp(); } }
window.addEventListener('hashchange', ruta);
window.addEventListener('load', () => setTimeout(ruta, 300));

function operatorView() { return { azi: deLucrat, comenzi: comenziList, detaliu: () => comandaDetaliu(UI.sel), pas: () => pasOperator(UI.sel), cereri: cereriView, probleme }[UI.view](); }

/* ---------- notificări pe telefon (Web Push): ajung și cu aplicația închisă ---------- */
const VAPID_PUBLIC = 'BHB4EoKm8vms-3CU2p3vGwml-oOSVnyvQPr60nj7Y_aEOuvS1Chea-C0hNn8XXjv4CdABjUCFFryCK-KCQijuaQ';
const PUSH = { stare: 'necunoscut' };
const arePush = () => 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
const peIphone = () => /iPhone|iPad/.test(navigator.userAgent);
const instalata = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function b64Bytes(s) { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)); return Uint8Array.from(b, (c) => c.charCodeAt(0)); }
async function salveazaAbonament(sub) {
  if (!SYNC.on) return;
  const { error } = await SYNC.sb.from('push_abonamente').upsert({ endpoint: sub.endpoint, user_id: SYNC.user.id, specialist_id: SYNC.prof.specialist_id || null, rol: SYNC.prof.rol, abonament: sub.toJSON() }, { onConflict: 'endpoint' });
  if (error) throw error;
}
async function pornestePush() {
  if (peIphone() && !instalata()) { openModal('Pe iPhone', '<p>Apasă Partajează, apoi „Adaugă pe ecranul principal”. Deschide aplicația de pe ecran și activează notificările.</p>'); return; }
  if (!arePush()) { toast('Browserul acesta nu are notificări. Folosește Chrome.'); return; }
  const p = await Notification.requestPermission();
  if (p !== 'granted') { PUSH.stare = 'refuzat'; renderApp(); return; }
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64Bytes(VAPID_PUBLIC) });
  await salveazaAbonament(sub); PUSH.stare = 'activ'; toast('Notificările sunt pornite.');
}
/* la intrare, reîmprospătez abonamentul existent: telefonul îl poate schimba în timp */
async function verificaPush() {
  if (!UI.auth || !arePush() || PUSH.stare !== 'necunoscut') return;
  const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription();
  PUSH.stare = sub ? 'activ' : Notification.permission === 'denied' ? 'refuzat' : 'oprit';
  if (sub) salveazaAbonament(sub).catch((e) => console.warn(e));
  if (PUSH.stare !== 'activ' && UI.role === 'specialist' && !typingNow()) renderApp();
}
function cardNotificari() {
  if (PUSH.stare === 'activ' || PUSH.stare === 'necunoscut') return '';
  if (PUSH.stare === 'refuzat') return '<div class="card war small">Notificările sunt blocate pe acest telefon. Le pornești din setările browserului, la acest site.</div>';
  return '<div class="card info">' + btn('notifon', 'Pornește notificările', { c: 'pri' }) + ' <span class="small mut">ca să afli imediat când îți vine o comandă, chiar cu aplicația închisă</span></div>';
}
A.notifon = () => pornestePush().catch((e) => toast('Notificările nu au pornit: ' + e.message));
setInterval(verificaPush, 5000);
