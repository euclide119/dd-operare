/* Platforma de operare · acțiuni, formulare, ceasuri, pornire. */
'use strict';

function platiRole() { return UI.view === 'decont' ? decont() : UI.view === 'marja' ? marja() : platiView(); }

const val = (k) => { const e = document.querySelector('[data-m="' + k + '"]'); return e ? (e.type === 'checkbox' ? e.checked : e.value) : ''; };
const mf = (k, label, type, extra) => '<label>' + label + (type === 'textarea' ? '<textarea data-m="' + k + '" rows="3">' + esc(extra || '') + '</textarea>' : '<input data-m="' + k + '" type="' + (type || 'text') + '" value="' + esc(extra || '') + '"' + (type === 'checkbox' ? '' : '') + '>') + '</label>';
const msel = (k, label, opts, cur) => '<label>' + label + '<select data-m="' + k + '">' + opts.map((o) => '<option value="' + (Array.isArray(o) ? o[0] : o) + '"' + ((Array.isArray(o) ? o[0] : o) === cur ? ' selected' : '') + '>' + (Array.isArray(o) ? o[1] : o) + '</option>').join('') + '</select></label>';
const openModal = (title, html) => { MODAL = { title, html }; renderApp(); };

function contractTpl(tip, s, cal) { return tip === 'neconcurenta' ? tplNeconcurenta(s, cal) : tip === 'prestari' ? tplColaborare(s) : tip === 'tehnic' ? tplTehnic(s && s.nume) : CONTRACTE_TIP[tip] + ' — se încarcă copia semnată.\n'; }

const FILEBLOBS = {};
async function fnConturi(body) {
  const { data, error } = await SYNC.sb.functions.invoke('conturi', { body });
  if (error) { let m = error.message; try { const j = await error.context.json(); if (j.error) m = j.error; } catch (e) { /* fără corp */ } throw new Error(m); }
  if (data && data.error) throw new Error(data.error);
  return data;
}
const REDIRECT = () => location.origin + location.pathname;
const pers = (key) => semnatari().find((p) => p.key === key);
const A = {
  planf: (d) => { UI.f.planWho = d.id; },
  plans: (d) => { UI.f.planSt = d.id; },
  svfilt: (d) => { UI.f.sv = d.id; },
  jtab: (d) => { UI.f.jt = d.id; UI.act = null; },
  jadd: () => { const t = val('jtext').trim(); if (!t) { toast('Scrie ce e de rezolvat.'); return; } const j = { id: uid('ju'), cat: val('jcat'), text: t, prio: val('jprio'), stare: 'deschis', resp: '', nota: '', la: now() }; D('juridic')[j.id] = j; ev('juridic.adaugat', (UI.auth || {}).nume || 'admin', null, { cat: j.cat }); },
  jgen: (d) => { const p = pers(d.id); const tips = ACTE_PERS[p.cal] || [['neconcurenta', 'colaborator']]; openModal('Acte de completat · ' + esc(p.nume), '<p class="small mut">Se deschid completate cu datele persoanei; restul câmpurilor le completezi în editor, apoi Print / PDF / Word / Trimite.</p><div class="btns">' + tips.map((t) => btn('actpers', ACTE_TPL[t[0]].nume + (t[1] ? ' (' + t[1] + ')' : ''), { id: d.id, x: t[0] + '|' + (t[1] || ''), c: 'mic' })).join('') + '</div>'); },
  actpers: (d) => { const p = pers(d.id); const [tip, cal] = d.x.split('|'); const s = p.spec ? D('specialisti')[p.spec] : null; UI.act = s ? acteDinSpecialist(tip, s) : acteNou(tip, { p_den: p.nume, sal_nume: p.nume }); if (cal) UI.act.v.calitate = cal; if (tip === 'cim' && cal === 'cu neconcurență') { UI.act.v.nc = 'da'; delete UI.act.v.calitate; } UI.view = 'juridic'; UI.f.jt = 'acte'; MODAL = null; },
  jdl: (d) => { const p = pers(d.id); const s = p.spec ? D('specialisti')[p.spec] : { nume: p.nume, atestat: '', spec: [] }; dl(d.x + '_' + p.nume.replace(/\W+/g, '_') + '.txt', contractTpl(d.x, s, p.cal)); },
  jup: (d) => { const p = pers(d.id); const need = DOC_NECESARE[p.cal] || ['neconcurenta']; openModal('Încarcă document semnat · ' + esc(p.nume), '<div class="frm">' + msel('tip', 'Document', need.map((t) => [t, CONTRACTE_TIP[t] || DOC_NUME[t]])) + mf('sem', 'Data semnării', 'date', new Date(now()).toISOString().slice(0, 10)) + mf('exp', 'Valabil până la', 'date', new Date(now() + 730 * ZI).toISOString().slice(0, 10)) + mf('fis', 'Fișier (copia semnată)', 'text', 'semnat.pdf') + '</div>' + btn('msubmit', 'Salvează', { id: 'jup:' + d.id, c: 'pri' })); },
  rfilt: (d) => { UI.f.r = d.id; },
  pdfx: async (d) => {
    const doc = D('documente')[d.x]; const url = FILEBLOBS[d.x] || await syncFileUrl(doc);
    if (!url) { toast('PDF-ul nu e disponibil aici: în modul demo se păstrează doar numele fișierului. Folosește „Testează pe un PDF de CF”.'); return; }
    try { toast('Citesc PDF-ul…'); const txt = await pdfText(url); UI.pdfRes = UI.pdfRes || {}; UI.pdfRes[d.id] = parseCF(txt); toast('PDF citit.'); } catch (e) { toast('Nu am putut citi PDF-ul: ' + e.message); }
  },
  fisasave: (d) => { const x = colectie().find((y) => y.im.id === d.id); if (!x) return; R.db.fise = R.db.fise || {}; R.db.fise[d.id] = fisaPentruBaza(x, (UI.pdfRes || {})[d.id]); ev('fisa.salvata', (UI.auth || {}).nume || 'admin', null, { imobil: d.id }); toast('Fișa e în bază.'); },
  fisetot: () => { R.db.fise = R.db.fise || {}; const xs = colectie(); xs.forEach((x) => (R.db.fise[x.im.id] = fisaPentruBaza(x, (UI.pdfRes || {})[x.im.id]))); ev('fisa.colectie', (UI.auth || {}).nume || 'admin', null, { n: xs.length }); toast(xs.length + ' fișe salvate în bază.'); },
  fisejson: () => dl('colectie_cf_' + new Date().toISOString().slice(0, 10) + '.json', exportColectie('json'), 'application/json'),
  fisecsv: () => dl('colectie_cf_' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + exportColectie('csv'), 'text/csv;charset=utf-8'),
  conturiload: async () => { try { UI.conturi = (await fnConturi({ actiune: 'lista' })).conturi; } catch (e) { toast(e.message); } },
  contnou: async () => { const body = { actiune: 'creeaza', email: val('email'), nume: val('nume'), rol: val('rol'), specialist_id: val('spid') || null, parola: val('parola') || null, redirect: REDIRECT() }; try { const r = await fnConturi(body); toast(r.invitat ? 'Invitație trimisă pe email.' : 'Cont creat și activ.'); UI.conturi = (await fnConturi({ actiune: 'lista' })).conturi; } catch (e) { toast(e.message); } },
  controlm: (d) => { const c = (UI.conturi || []).find((x) => x.id === d.id); const sp = L('specialisti', (s) => !s.sistem); openModal('Rol · ' + esc(c.email), '<div class="frm"><label>Rol<select data-m="rol">' + Object.keys(ROL_TXT).map((r) => '<option value="' + r + '"' + (r === c.rol ? ' selected' : '') + '>' + ROL_TXT[r] + '</option>').join('') + '</select></label><label>Specialist<select data-m="spid"><option value="">—</option>' + sp.map((s) => '<option value="' + s.id + '"' + (s.id === c.specialist_id ? ' selected' : '') + '>' + esc(s.nume) + '</option>').join('') + '</select></label>' + mf('nume', 'Nume afișat', 'text', c.nume || '') + '</div>' + btn('control', 'Salvează', { id: c.id, c: 'pri' })); },
  control: async (d) => { try { await fnConturi({ actiune: 'rol', id: d.id, rol: val('rol'), specialist_id: val('spid') || null, nume: val('nume') }); MODAL = null; UI.conturi = (await fnConturi({ actiune: 'lista' })).conturi; toast('Rol salvat.'); } catch (e) { toast(e.message); } },
  contbloc: async (d) => { if (!confirm('Blochezi contul? Persoana nu mai poate intra.')) return; try { await fnConturi({ actiune: 'blocheaza', id: d.id }); UI.conturi = (await fnConturi({ actiune: 'lista' })).conturi; } catch (e) { toast(e.message); } },
  contdebloc: async (d) => { try { await fnConturi({ actiune: 'deblocheaza', id: d.id }); UI.conturi = (await fnConturi({ actiune: 'lista' })).conturi; } catch (e) { toast(e.message); } },
  contreset: async (d) => { try { await fnConturi({ actiune: 'reset', email: d.id, redirect: REDIRECT() }); toast('Email de resetare trimis.'); } catch (e) { toast(e.message); } },
  demolist: () => { UI.demoList = true; },
  demolog: (d) => { if (d.id === 'specialist') { const s = SPECIALISTI_SEED.find((x) => x.id === d.x); UI.auth = { rol: 'specialist', sid: s.id, nume: s.nume }; UI.view = 'disp'; } else if (d.id === 'client') { UI.auth = { rol: 'client', nume: 'Client (previzualizare)' }; UI.view = 'pagina'; } else { const c = DEMO_CONTURI.find((x) => x[0] === d.id); UI.auth = { rol: d.id, nume: c[2] }; UI.view = firstView(d.id); } UI.role = UI.auth.rol; UI.knownOffers = null; UI.alert = ''; },
  logout: async () => { UI.auth = null; UI.demoList = false; UI.alert = ''; MODAL = null; if (SYNC.on) await syncLogout(); },
  notifon: () => { if (typeof Notification !== 'undefined') Notification.requestPermission().then(() => renderApp()); },
  vfile: async (d) => { const doc = D('documente')[d.id]; if (!doc) { toast('Documentul nu e disponibil.'); return; } const u = FILEBLOBS[d.id] || await syncFileUrl(doc); if (u) window.open(u, '_blank'); else toast('În modul demo se păstrează doar numele fișierului; fișierul real se vede doar în sesiunea în care a fost încărcat.'); },
  seedremote: async () => { toast('Indisponibil pe adresa publică.'); return; if (!confirm('Încarc datele de test în baza de date comună?')) return; SYNC.onprogress = (n, t) => { TOAST = 'Se încarcă: ' + n + ' / ' + t; const el = document.getElementById('toast'); if (el) el.textContent = TOAST; else renderApp(); }; try { await syncSeedRemote(); toast('Datele de test au fost încărcate.'); } catch (e) { toast('Nu s-au putut încărca: ' + e.message); } SYNC.onprogress = null; },
  nav: (d) => { UI.view = d.id; UI.sel = null; if (d.id === 'conturi' && SYNC.on && (UI.auth || {}).rol === 'admin') return A.conturiload(); },
  go: (d) => { UI.view = d.id; },
  go2: (d) => { if (d.id.startsWith('sv:')) { UI.view = 'servicii'; return; } if (d.id.startsWith('sp:')) { UI.view = 'spdet'; UI.sel = d.id.slice(3); } else { UI.view = 'detaliu'; UI.sel = d.id; } },
  open2: (d) => { const o = orderBy(d.id); if (o) { UI.view = 'detaliu'; UI.sel = o.id; } },
  fl: (d) => {
    const [k, a, b] = d.id.split(':');
    if (k === 'o') { const os = L('comenzi').filter((o) => (a === 'neplatita' ? ['neconfirmata', 'in_asteptare_acord'].includes(o.stare) : etapa(o) === a)); openModal('Comenzi · ' + a.replace('_', ' '), tbl(['Nr', 'Client', 'Imobil', 'Stare'], os.map((o) => '<tr class="rl" data-a="open" data-id="' + o.id + '"><td>' + o.nr + '</td><td>' + esc(clName(o)) + '</td><td>' + imoText(D('imobile')[o.imobile[0]]) + '</td><td>' + chip(etapa(o)) + ' ' + progress(o.id) + '</td></tr>'))); return; }
    const ts = L('taskuri').filter((t) => (a === 'oferit' ? ['oferit', 'disponibil'].includes(t.stare) && t.spec !== 'motor' : a === 'problema' ? ['blocat', 'esuat'].includes(t.stare) : a === 'late' ? slaInfo(t).stare === 'late' : t.stare === a));
    openModal('Pași · ' + a, tbl(['Comandă', 'Pas', 'Cine', 'Stare'], ts.slice(0, 150).map((t) => '<tr class="rl" data-a="open" data-id="' + t.comanda + '"><td>' + orderOf(t).nr + '</td><td>' + esc(t.n) + '</td><td>' + esc(spName(t.specialist) === '—' ? SPEC[t.spec] : spName(t.specialist)) + '</td><td>' + chip(t.stare) + ' ' + termen(t) + '</td></tr>')));
  },
  mclose: () => { MODAL = null; },
  reset: async () => { toast('Indisponibil pe adresa publică.'); return; if (!confirm('Resetez toate datele de test (20 de comenzi)?')) return; if (SYNC.on) { try { await syncSeedRemote(); } catch (e) { toast(e.message); return; } } else seedAll(); UI.sel = null; UI.view = firstView(UI.role); },
  retr: () => openModal('Retragere din contract', '<p>Declarația online de retragere (OUG 34/2014, art. 11^1). În faza 1 nu se trimite nicăieri.</p>' + mf('nume', 'Numele tău') + mf('ctr', 'Comanda', 'text', UI.client) + mf('conf', 'Unde să trimitem confirmarea (email)', 'email') + '<p class="mut small">Serviciile deja executate integral cu acordul tău nu se pot retrage; pentru cele în curs plătești proporțional ce s-a prestat.</p>' + btn('mclose', 'Trimite declarația', { c: 'pri' })),
  ascl: (d) => { UI.role = 'client'; UI.client = d.id; UI.view = 'pagina'; },
  asspec: (d) => { UI.role = 'specialist'; UI.spec = d.id; UI.view = 'disp'; },
  scrie: (d) => openModal('Scrie clientului', mf('txt', 'Mesaj', 'textarea') + btn('msubmit', 'Trimite', { id: 'scrie:' + d.id, c: 'pri' })),
  intreb: (d) => openModal('Întrebare', mf('txt', 'Întrebarea ta', 'textarea') + btn('msubmit', 'Trimite', { id: 'intreb:' + d.id, c: 'pri' })),
  inchide: (d) => closeOrder(d.id),
  retry: (d) => retryMotor(d.id), runm: (d) => { const t = D('taskuri')[d.id]; runMotor(t); advance(); },
  retrage: (d) => withdrawTask(d.id), requeue: (d) => requeue(d.id),
  pcap: (d) => { payCapture(d.id); toast('Plată capturată (webhook simulat)'); }, pfail: (d) => payFail(d.id, 'card refuzat'), pfact: (d) => invoice(d.id), spv: (d) => spvSet(d.id, d.x),
  pref: (d) => {
    const p = D('plati')[d.id]; const o = D('comenzi')[p.comanda]; const livr = L('linii', (l) => l.comanda === o.id && l.stare === 'livrat' && !l.incl).reduce((a, l) => a + (l.pret || 0), 0);
    openModal('Rambursare · ' + o.nr, '<p>Sumă plătită: <b>' + lei(p.suma) + '</b>, deja rambursat: ' + lei(p.rambursat) + '. Servicii livrate (executate): ' + lei(livr) + '.</p><p class="mut small">Retragere în 14 zile: se rambursează suma minus serviciile prestate (OUG 34/2014, art. 14 alin. (3)) [D — de verificat pe text].</p>' + mf('suma', 'Suma de rambursat (lei)', 'number', Math.max(0, p.suma - p.rambursat - livr)) + msel('motiv', 'Motiv', ['retragere 14 zile (proporțional)', 'imobil neidentificabil', 'serviciu nelivrat', 'eroare internă', 'altul']) + btn('msubmit', 'Rambursează', { id: 'pref:' + d.id, c: 'pri' }));
  },
  reia: (d) => {
    const o = D('comenzi')[d.id];
    if (UI.role === 'client' && o.acord !== true) { const c = document.querySelector('[data-i="cl_acord"]'); if (!c || !c.checked) { toast('Bifează acordul de executare imediată.'); return; } o.acord = true; o.acord_la = now(); o.acord_text = 'v1'; ev('comanda.acord', 'client', { k: 'comanda', id: o.id }, { versiune: 'v1' }); }
    const ls = L('linii', (l) => l.comanda === d.id && l.tip === 'plata' && l.stare === 'asteptare');
    const sum = ls.reduce((a, l) => a + (l.pret || 0), 0) + (o.urgent ? URGENT_PRICE : 0);
    const p = newPay(o, sum, ls.map((l) => l.id)); payCapture(p.id); toast('Plata reluată și capturată');
  },
  cacord: (d) => { const c = document.querySelector('[data-i="cl_acord"]'); if (!c || !c.checked) { toast('Bifează acordul pentru a continua.'); return; } giveAcord(d.id, 'v1'); toast('Acord înregistrat. Comanda intră în lucru.'); },
  spd: (d) => { UI.view = 'spdet'; UI.sel = d.id; },
  open: (d) => { UI.view = 'detaliu'; UI.sel = d.id; MODAL = null; },
  spnou: () => spForm(null), spedit: (d) => spForm(D('specialisti')[d.id]),
  valid: (d) => { if (!contractOk(d.id)) { toast('Lipsesc contracte semnate / valabile.'); return; } const s = D('specialisti')[d.id]; s.status = 'activ'; s.tura = true; ev('specialist.validat', 'admin', { k: 'specialist', id: d.id }); dispatchWaiting(); },
  susp: (d) => { D('specialisti')[d.id].status = 'suspendat'; ev('specialist.suspendat', 'admin', { k: 'specialist', id: d.id }); },
  ctpl: (d) => { const s = D('specialisti')[d.id]; const k = { prestari: 'servicii', neconcurenta: 'neconcurenta', tehnic: 'tehnic' }[d.x] || 'servicii'; UI.act = acteDinSpecialist(k, s); UI.view = 'juridic'; UI.f.jt = 'acte'; MODAL = null; },
  jtpl: (d) => { UI.act = acteNou({ prestari: 'servicii', neconcurenta: 'neconcurenta', tehnic: 'tehnic' }[d.x] || d.x); UI.f.jt = 'acte'; },
  jsem: () => openModal('Persoană nouă (primul document semnat)', '<div class="frm">' + mf('nume', 'Nume') + msel('cal', 'Calitate', Object.keys(CALITATI).map((k) => [k, CALITATI[k]])) + mf('sem', 'Data semnării', 'date', new Date(now()).toISOString().slice(0, 10)) + mf('exp', 'Valabil până la', 'date', new Date(now() + 730 * ZI).toISOString().slice(0, 10)) + mf('fis', 'Fișier (copia semnată)', 'text', 'neconcurenta_semnat.pdf') + '</div>' + btn('msubmit', 'Înregistrează', { id: 'jsem', c: 'pri' })),
  dltpl: (d) => dl(d.x + (d.id ? '_' + d.id : '_sablon') + '.txt', contractTpl(d.x, d.id ? D('specialisti')[d.id] : null, 'colaborator')),
  cup: (d) => { const exp = new Date(now() + (d.x === 'atestat' ? 365 : 730) * ZI).toISOString().slice(0, 10); openModal(CONTRACTE_TIP[d.x] + ' — marchează semnat', mf('sem', 'Data semnării', 'date', new Date(now()).toISOString().slice(0, 10)) + mf('exp', 'Expiră la', 'date', exp) + mf('fis', 'Fișier (copia semnată)', 'text', d.x + '_' + d.id + '_semnat.pdf') + btn('msubmit', 'Salvează', { id: 'cup:' + d.id + ':' + d.x, c: 'pri' })); },
  csv: () => { const rows = [['specialist', 'specialitate', 'taskuri', 'de_plata']]; L('specialisti', (s) => !s.sistem).forEach((s) => { const e = R.db.evenimente.filter((x) => x.tip === 'task.terminat' && x.data.spec === s.id); rows.push([s.nume, s.spec[0], e.length, e.reduce((a, x) => a + (x.data.tarif || 0), 0)]); }); dl('decont_specialisti.csv', rows.map((r) => r.join(';')).join('\n'), 'text/csv;charset=utf-8'); },
  prez: (d) => openModal('Rezolvă problema', mf('txt', 'Cum s-a rezolvat', 'textarea') + btn('msubmit', 'Marchează rezolvată', { id: 'prez:' + d.id, c: 'pri' })),
  pcanc: (d) => { const p = D('probleme')[d.id]; const t = D('taskuri')[p.task]; const l = D('linii')[t.linie]; openModal('Anulează serviciul și rambursează', '<p>' + esc(svName(l.svc)) + ' — ' + lei(l.pret || 0) + '</p>' + mf('suma', 'Sumă de rambursat', 'number', l.pret || 0) + btn('msubmit', 'Anulează + rambursează', { id: 'pcanc:' + d.id, c: 'war' })); },
  pesc: (d) => { const p = D('probleme')[d.id]; p.escaladata = true; notifyIn('admin', 'Problemă escaladată: ' + p.tip, p.task); },
  sg: (d) => { D('sugestii')[d.id].stare = d.x; ev('sugestie.' + d.x, 'admin', null); },
  tnou: () => openModal('Țintă nouă', mf('t', 'Titlu') + mf('c', 'Componentă') + mf('r', 'Criteriu „rezolvat”', 'textarea') + msel('p', 'Prioritate', ['critic', 'mare', 'mediu']) + btn('msubmit', 'Adaugă', { id: 'tnou', c: 'pri' })),
  rn: (d) => { const n = D('notificari')[d.id]; n.stare = 'trimis (simulat)'; n.eroare = ''; n.la = now(); },
  src: (d) => { const s = R.db.surse[+d.id]; s.stare = d.x; if (d.x === 'ok') s.ultim_ok = now(); },
  rem: (d) => { const c = R.db.cosuri.find((x) => x.id === d.id); c.reminder = true; ev('reminder.cos', 'sales', null, { email: c.email }); toast('Reminder trimis către ' + c.email + ' (simulat)'); },
  cot: (d) => { const v = +document.querySelector('[data-i="qp_' + d.id + '"]').value; if (!v) { toast('Introdu prețul.'); return; } quote(d.id, v, null); },
  qsend: (d) => sendQuote(d.id),
  qacc: (d) => { const q = D('oferte_pret')[d.id]; if (UI.role === 'client') { const c = document.querySelector('[data-i="cl_acord_q"]'); if (c && !c.checked) { toast('Bifează acordul de executare imediată.'); return; } } const p = acceptQuote(d.id); payCapture(p.id); toast('Ofertă acceptată, a doua plată capturată'); },
  qdec: (d) => declineQuote(d.id),
  tk: (d) => { UI.view = 'task'; UI.sel = d.id; },
  acc: (d) => { if (!acceptTask(d.id, UI.spec)) toast('Oferta nu mai e valabilă.'); else { UI.view = 'task'; UI.sel = d.id; } },
  ref: (d) => refuseTask(d.id, UI.spec, 'refuzat'),
  demof: (d) => { const t = D('taskuri')[d.id]; addFile(d.id, d.x, d.x + '_' + orderOf(t).nr + '.pdf', 0.3, UI.spec); },
  fill: (d) => demoFill(d.id),
  fin: (d) => { const err = finishTask(d.id, UI.spec); if (err.length) { openModal('Nu poți trimite mai departe', '<ul>' + err.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>'); return; } UI.view = 'mele'; UI.sel = null; toast('Trimis mai departe'); },
  pbm: (d) => openModal('Problemă', msel('tip', 'Tip', PROBLEME_TIP) + mf('txt', 'Descriere', 'textarea') + '<p class="mut small">Taskul se blochează și admin/tehnic sunt anunțați.</p>' + btn('msubmit', 'Trimite problema', { id: 'pbm:' + d.id, c: 'war' })),
  sgm: (d) => openModal('Sugestie', msel('cat', 'Categorie', ['produs', 'flux', 'preț', 'sursă nouă', 'bug']) + mf('txt', 'Sugestia ta', 'textarea') + btn('msubmit', 'Trimite', { id: 'sgm:' + d.id, c: 'pri' })),
  ret: (d) => { const t = D('taskuri')[d.id]; openModal('Returnează taskul', '<p>' + (t.retur ? 'Ai mai returnat acest task: <b>se contorizează penalizare</b>.' : 'Prima returnare nu are penalizare.') + '</p>' + mf('txt', 'Motiv', 'textarea') + btn('msubmit', 'Returnează', { id: 'ret:' + d.id, c: 'war' })); },
  sgsend: () => { const t = document.querySelector('[data-i="sg_txt"]').value.trim(); if (!t) return; addSuggestion(UI.spec, null, t, document.querySelector('[data-i="sg_cat"]').value); toast('Sugestie trimisă'); },
  dl: (d) => { const x = D('documente')[d.id]; dl(x.nume.replace(/\.pdf$/, '') + '.txt', 'Document demonstrativ (faza 1 păstrează doar metadate).\nFișier: ' + x.nume + '\nTip: ' + x.tip + '\nHash: ' + x.hash + '\nÎn faza 2 fișierul real vine din Storage privat (link semnat, valabil limitat).\n'); },
  nou: () => {
    const priced = Object.keys(SV).filter((k) => SV[k][1] != null && !['pauza', 'invalidat'].includes((D('servicii')[k] || {}).stare)).map((k) => '<label class="inl"><input type="checkbox" data-m="sv_' + k + '"' + (k === 'cf' ? ' checked' : '') + '> ' + SV[k][0] + ' (' + SV[k][1] + ')</label>').join('');
    const q = Object.keys(SV).filter((k) => SV[k][1] == null && !['pauza', 'invalidat'].includes((D('servicii')[k] || {}).stare)).map((k) => '<label class="inl"><input type="checkbox" data-m="sv_' + k + '"> ' + SV[k][0] + '</label>').join('');
    openModal('Comandă simulată (ca și cum ar veni de pe site)', '<div class="frm">' + msel('mode', 'Mod', [['cf', 'Am nr. CF'], ['addr', 'Am adresa + pin']]) + mf('cf', 'Nr. CF / adresă', 'text', '412999') + msel('judet', 'Județ', JUDETE, 'Timiș') + mf('uat', 'UAT', 'text', 'Giroc') + msel('tip', 'Tip imobil', [['casa', 'casă'], ['ap', 'apartament'], ['teren', 'teren']]) + mf('email', 'Email', 'email', 'test@exemplu.ro') + mf('wa', 'WhatsApp (opt-in, opțional)', 'text', '') + msel('pay', 'Plata', [['ok', 'Plătită'], ['esuata', 'Eșuată'], ['neplatita', 'Neplătită']]) + '</div><label class="inl"><input type="checkbox" data-m="urgent"> urgent</label> <label class="inl"><input type="checkbox" data-m="acord" checked> acord de executare imediată bifat la plată</label><h4>Servicii cu preț</h4>' + priced + '<h4>La ofertă</h4>' + q + '<div class="btns">' + btn('msubmit', 'Creează comanda', { id: 'nou', c: 'pri' }) + '</div>');
  },
  sb: async () => {
    const c = window.EPAY_CFG; if (!c || !c.supabaseUrl || !c.supabaseKey) { toast('Lipsește config.js (EPAY_CFG). În faza 1 folosește „Comandă simulată”.'); return; }
    try {
      const r = await fetch(c.supabaseUrl + '/rest/v1/epay_comenzi?select=*&order=created_at.desc&limit=50', { headers: { apikey: c.supabaseKey, Authorization: 'Bearer ' + c.supabaseKey } }); const rows = await r.json(); let n = 0;
      rows.forEach((x) => { if (L('comenzi', (o) => o.nr === x.nr).length) return; const sv = (x.servicii || []).filter((s) => SV[s]); createFromRow({ nr: x.nr, mode: x.mod || (x.cf ? 'cf' : 'addr'), cf: x.cf, adresa: x.adresa, pin: x.pin_lat ? [x.pin_lat, x.pin_lng] : null, judet: x.judet, uat: x.uat, tip: 'casa', sv, urgent: x.urgent, email: x.email, cl: '', pay: 'neplatita', sursa: 'site' }); n++; });
      toast(n + ' comenzi importate din epay_comenzi'); commit();
    } catch (e) { toast('Import eșuat: ' + e.message); }
  }
};
Object.assign(A, ACTE_A);
function dispatchWaiting() { L('taskuri', (t) => t.stare === 'escaladat').forEach((t) => dispatch(t)); }
function createFromRow(row) {
  const o = createOrder(Object.assign({ acord: row.acord }, row));
  const priced = L('linii', (l) => l.comanda === o.id && l.tip === 'plata');
  const sum = priced.reduce((a, l) => a + (l.pret || 0), 0) + (o.urgent ? URGENT_PRICE : 0); o.total = sum;
  if (row.pay === 'neplatita') newPay(o, sum, priced.map((l) => l.id));
  else if (row.pay === 'esuata') { const p = newPay(o, sum, priced.map((l) => l.id)); payFail(p.id, 'card refuzat'); }
  else if (priced.length) { const p = newPay(o, sum, priced.map((l) => l.id)); payCapture(p.id); }
  return o;
}
function spForm(s) {
  openModal(s ? 'Editează specialist' : 'Specialist nou', '<div class="frm">' + mf('nume', 'Nume', 'text', s ? s.nume : '') + msel('spec', 'Specialitate', SPEC_HUMAN.map((k) => [k, SPEC[k]]), s ? s.spec[0] : 'ancpi') + mf('judete', 'Județe (separate prin virgulă, * = toate)', 'text', s ? s.judete.join(', ') : 'Timiș') + mf('uat', 'UAT de bază', 'text', s ? s.uat : '') + mf('cap', 'Capacitate simultană', 'number', s ? s.cap : 2) + mf('rating', 'Rating intern', 'number', s ? s.rating : 4) + mf('atestat', 'Autorizație / atestat', 'text', s ? s.atestat : '') + mf('tel', 'Telefon', 'text', s ? s.tel : '') + mf('email', 'Email', 'email', s ? s.email : '') + '</div>' + btn('msubmit', 'Salvează', { id: 'sp:' + (s ? s.id : ''), c: 'pri' }));
}
A.msubmit = (d) => {
  const [k, a, b] = d.id.split(':'); const txt = val('txt');
  if (k === 'scrie') { R.db.mesaje.push({ comanda: a, de: 'echipă', text: txt, la: now() }); const o = D('comenzi')[a]; const n = { id: uid('nt'), dest: 'client', comanda: a, canal: 'email', sablon: 'manual', subj: 'Mesaj de la echipă (' + o.nr + ')', body: txt, la: now(), stare: o.din_site ? 'de trimis' : 'trimis (simulat)', eroare: '' }; D('notificari')[n.id] = n; }
  else if (k === 'intreb') { R.db.mesaje.push({ comanda: a, de: 'client', text: txt, la: now() }); notifyIn('admin', 'Întrebare de la client (' + D('comenzi')[a].nr + '): ' + txt.slice(0, 80)); }
  else if (k === 'pref') { refund(a, +val('suma'), val('motiv'), 'plati'); }
  else if (k === 'prez') resolveProblem(a, txt, UI.role);
  else if (k === 'pcanc') { const p = D('probleme')[a]; const t = D('taskuri')[p.task]; const pl = L('plati', (x) => x.comanda === t.comanda && x.linii.includes(t.linie))[0] || L('plati', (x) => x.comanda === t.comanda)[0]; cancelLine(t.linie, 'neidentificabil'); resolveProblem(a, 'Serviciu anulat, rambursat ' + val('suma') + ' lei', 'admin', true); if (pl) refund(pl.id, +val('suma'), 'imobil neidentificabil', 'admin'); }
  else if (k === 'tnou') { const n = Math.max(...L('tinte').map((x) => parseInt(x.id.slice(1)))) + 1; D('tinte')['T' + n] = { id: 'T' + n, titlu: val('t'), comp: val('c'), rezolvat: val('r'), prio: val('p'), stare: 'deschis', resp: '', termen: '', seed: '' }; }
  else if (k === 'pbm') { openProblem(a, UI.spec, val('tip'), txt); UI.view = 'mele'; }
  else if (k === 'sgm') addSuggestion(UI.spec, a, txt, val('cat'));
  else if (k === 'ret') { returnTask(a, UI.spec, txt); UI.view = 'mele'; UI.sel = null; }
  else if (k === 'jup') { const p = pers(d.id.slice(4)); const c = { id: uid('ct'), spec: p.spec, nume: p.nume, calitate: p.cal, tip: val('tip'), semnat_la: new Date(val('sem')).getTime(), verificat_de: (UI.auth || {}).nume || 'admin', expira_la: new Date(val('exp')).getTime(), fisier: val('fis') }; D('contracte')[c.id] = c; ev('contract.incarcat', 'admin', null, { tip: c.tip, nume: c.nume }); }
  else if (k === 'jsem') { const c = { id: uid('ct'), spec: null, nume: val('nume'), calitate: val('cal'), tip: 'neconcurenta', semnat_la: new Date(val('sem')).getTime(), verificat_de: 'Manu', expira_la: new Date(val('exp')).getTime(), fisier: val('fis') }; D('contracte')[c.id] = c; ev('contract.incarcat', 'admin', null, { tip: 'neconcurenta', nume: c.nume }); }
  else if (k === 'cup') { const c = { id: uid('ct'), spec: a, nume: D('specialisti')[a].nume, calitate: 'colaborator', tip: b, semnat_la: new Date(val('sem')).getTime(), verificat_de: 'Manu', expira_la: new Date(val('exp')).getTime(), fisier: val('fis') }; D('contracte')[c.id] = c; ev('contract.incarcat', 'admin', { k: 'specialist', id: a }, { tip: b }); }
  else if (k === 'sp') {
    const o = a ? D('specialisti')[a] : { id: uid('sp'), status: 'invitat', tura: false };
    Object.assign(o, { nume: val('nume'), spec: [val('spec')], judete: val('judete').split(',').map((x) => x.trim()).filter(Boolean), uat: val('uat'), cap: +val('cap') || 1, rating: +val('rating') || 0, atestat: val('atestat'), tel: val('tel'), email: val('email') });
    D('specialisti')[o.id] = o; ev(a ? 'specialist.editat' : 'specialist.creat', 'admin', { k: 'specialist', id: o.id });
  } else if (k === 'nou') {
    const sv = Object.keys(SV).filter((s) => val('sv_' + s)); if (!sv.length) { toast('Alege cel puțin un serviciu.'); return; }
    let n = 10000 + Object.keys(D('comenzi')).length; while (orderBy('EP-' + n)) n++;
    const addr = val('mode') === 'addr';
    const o = createFromRow({ nr: 'EP-' + n, mode: val('mode'), cf: addr ? null : val('cf'), adresa: addr ? val('cf') : null, pin: addr ? [45.75 + Math.random() * 0.02, 21.2 + Math.random() * 0.02] : null, judet: val('judet'), uat: val('uat'), tip: val('tip'), sv, urgent: val('urgent'), email: val('email'), wa: val('wa') || null, cl: 'T.S.', pay: val('pay'), acord: !!val('acord') });
    toast('Comanda ' + o.nr + ' creată'); UI.view = 'detaliu'; UI.sel = o.id;
  }
  MODAL = null;
};

/* ---------- evenimente ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  if (el.classList.contains('ov') && e.target !== el) return;
  const a = el.dataset.a; if (!A[a]) return; e.preventDefault();
  const typing = false; if (typing) return;
  const ret = A[a](el.dataset);
  if (ret && ret.then) { ret.then(() => { if (UI.auth) commit(); else renderApp(); saveUI(); }); return; }
  if (UI.auth) commit(); else renderApp(); saveUI();
});
function rerenderFocus() {
  const ae = document.activeElement; const key = ae && ae.dataset && ae.dataset.i; const pos = ae && ae.selectionStart;
  renderApp(); if (key) { const n = document.querySelector('[data-i="' + key + '"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* tip fără selecție */ } } }
}
document.addEventListener('input', (e) => {
  const k = e.target.dataset && e.target.dataset.i; if (!k) return;
  if (k === 'fc_q') { UI.f.c = UI.f.c || {}; UI.f.c.q = e.target.value; saveUI(); rerenderFocus(); }
  else if (k.startsWith('fd|')) { const [, tid, i] = k.split('|'); const t = D('taskuri')[tid]; if (t) { t.fields[+i].val = e.target.value; R.save(); } }
});
document.addEventListener('change', (e) => {
  const el = e.target; const k = el.dataset && el.dataset.i; if (!k) return;
  const v = el.type === 'checkbox' ? el.checked : el.value;
  if (k === 'role') { UI.role = v; UI.view = firstView(v); UI.sel = null; if (v === 'specialist') UI.view = 'disp'; }
  else if (k === 'spec') { UI.spec = v; UI.view = 'disp'; UI.sel = null; }
  else if (k === 'client') { UI.client = v; }
  else if (k.startsWith('fc_')) { UI.f.c = UI.f.c || {}; UI.f.c[k.slice(3)] = v; }
  else if (k === 'fp_all') UI.f.pAll = v;
  else if (k === 'tura') { D('specialisti')[UI.spec].tura = v; ev('specialist.tura', UI.spec, null, { tura: v }); if (v) dispatchWaiting(); }
  else if (k.startsWith('ck|')) { const [, tid, i] = k.split('|'); D('taskuri')[tid].check[+i].ok = v; }
  else if (k.startsWith('fd|')) { const [, tid, i] = k.split('|'); D('taskuri')[tid].fields[+i].val = v; }
  else if (k.startsWith('up|')) { const [, tid, tip] = k.split('|'); Array.from(el.files).forEach((file) => { const nume = file.name && file.name !== 'image.jpg' ? file.name : 'poza_' + tip + '_' + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '') + '.jpg'; const f = addFile(tid, tip, nume, Math.round(file.size / 1e4) / 100, UI.role === 'specialist' ? UI.spec : 'operator', file.type); FILEBLOBS[f.doc] = URL.createObjectURL(file); syncUpload(D('documente')[f.doc], file); if (tip === 'extras_cf') ocrPorneste(f.doc); }); toast('Atașat. Caseta s-a bifat.'); }
  else if (k === 'pdftest') { const file = el.files[0]; if (!file) return; pdfText(URL.createObjectURL(file)).then((txt) => { UI.pdfTest = parseCF(txt); UI.pdfTest._caractere_citite = txt.length; renderApp(); }).catch((err) => toast('Nu am putut citi PDF-ul: ' + err.message)); return; }
  else if (k.startsWith('fa|')) { if (v) forceAssign(k.slice(3), v); }
  else if (k.startsWith('se_')) {
    const S = D('settings');
    if (k.startsWith('se_of_')) S.ofertaMin[k.slice(6)] = +v; else if (k === 'se_urg') S.urgentFactor = +v; else if (k === 'se_sla') S.slaFactor = +v; else if (k === 'se_pb') S.problemaMaxOre = +v; else if (k === 'se_tax') S.taxaAncpiMedie = +v;
    else if (k.startsWith('se_auto_')) S.autoAtribuire[k.slice(8)] = v; else if (k.startsWith('se_jud_')) { const j = k.slice(7); S.judeteActive = S.judeteActive.filter((x) => x !== j).concat(v ? [j] : []); }
  } else if (k.startsWith('ti_')) { const [, id, f] = k.split('_'); D('tinte')[id][f] = v; }
  else if (k.startsWith('ju|')) { const [, id, f] = k.split('|'); D('juridic')[id][f] = v; }
  else if (k.startsWith('sv|')) { const [, id, f] = k.split('|'); R.db.servicii = R.db.servicii || {}; const x = D('servicii')[id] || (D('servicii')[id] = { id, stare: 'in_test', motiv: '', criteriu: '', reverificare: '', istoric: [] }); if (f === 'stare' && x.stare !== v) { x.istoric = (x.istoric || []).concat(new Date(now()).toISOString().slice(0, 10) + ': ' + STARI_SERVICIU[x.stare][0] + ' → ' + STARI_SERVICIU[v][0] + ' (' + ((UI.auth || {}).nume || 'admin') + ')'); ev('serviciu.stare', (UI.auth || {}).nume || 'admin', null, { svc: id, din: x.stare, in: v }); } x[f] = v; x.schimbat_la = now(); }
  else if (k.startsWith('cl_acord') || k.startsWith('qp_') || k.startsWith('sg_')) { return; }
  commit(); saveUI();
});

/* ---------- ceasuri ---------- */
setInterval(tickTimers, 1000);
/* nu redesenăm cât timp cineva scrie sau are o listă deschisă (inclusiv „Interfața” din antet, care altfel se închidea singură) */
const typingNow = () => { const a = document.activeElement; return a && (a.tagName === 'SELECT' || (/INPUT|TEXTAREA/.test(a.tagName) && a.closest('#main'))); };
setInterval(() => {
  if (!UI.auth || !R.db) return;
  tick(); R.save(); watchOffers(); if (!typingNow() && !MODAL) renderApp();
}, SYNC_INTERVAL());
function SYNC_INTERVAL() { return 15000; }
/* comandă nouă pentru specialist: mesaj în aplicație + vibrație + notificare de sistem (dacă e permisă) */
function watchOffers() {
  if (!UI.auth || UI.role !== 'specialist') return;
  const open = L('oferte', (x) => x.spec === UI.spec && x.raspuns === 'deschisa').map((x) => x.id);
  if (UI.knownOffers == null) { UI.knownOffers = open; return; }
  const nou = open.filter((id) => !UI.knownOffers.includes(id)); UI.knownOffers = open;
  if (!nou.length) return;
  const t = D('taskuri')[D('oferte')[nou[0]].task]; const im = t && D('imobile')[t.imobil];
  UI.alert = 'Comandă nouă: ' + (t ? t.n : '') + (im ? ' · ' + (im.cf ? 'CF ' + im.cf + ', ' : '') + im.uat : '') + (nou.length > 1 ? ' (+' + (nou.length - 1) + ')' : '');
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') { try { new Notification('Comandă nouă', { body: UI.alert, tag: 'oferta-' + nou[0], icon: 'icon-192.png' }); } catch (e) { /* unele browsere cer service worker */ if (navigator.serviceWorker) navigator.serviceWorker.ready.then((r) => r.showNotification('Comandă nouă', { body: UI.alert, icon: 'icon-192.png', tag: 'oferta-' + nou[0] })); } }
}

function authFromSync() { if (SYNC.on && SYNC.prof) UI.auth = { rol: SYNC.prof.rol, sid: SYNC.prof.specialist_id, nume: SYNC.prof.nume || SYNC.user.email }; }
document.addEventListener('submit', async (e) => {
  const f = e.target;
  if (f.dataset.f === 'setpass') {
    e.preventDefault();
    const { error } = await SYNC.sb.auth.updateUser({ password: f.pass.value });
    if (error) { SYNC.err = error.message; renderApp(); return; }
    UI.setPass = false; SYNC.err = ''; history.replaceState(null, '', location.pathname);
    try { const { data } = await SYNC.sb.auth.getSession(); await afterLogin(data.session.user); authFromSync(); UI.role = UI.auth.rol; UI.view = firstView(UI.role); } catch (err) { SYNC.err = err.message; }
    renderApp(); return;
  }
  if (f.dataset.f !== 'login') return; e.preventDefault();
  try { SYNC.err = ''; await syncLogin(f.email.value.trim(), f.pass.value); authFromSync(); UI.role = UI.auth.rol; UI.view = firstView(UI.role); UI.knownOffers = null; tick(); saveUI(); renderApp(); } catch (err) { SYNC.err = err.message; renderApp(); }
});
window.addEventListener('DOMContentLoaded', async () => {
  const INVITE = /type=(invite|recovery)/.test(location.hash + location.search);
  try { await syncInit(); } catch (e) { SYNC.err = e.message; }
  if (syncAvailable()) { if (INVITE) { UI.setPass = true; UI.auth = null; } else if (SYNC.on) authFromSync(); else UI.auth = null; }
  if (!SYNC.on) boot(); else tick();
  SYNC.onchange = () => { clearTimeout(window.__rr); window.__rr = setTimeout(() => { if (['admin', 'tehnic'].includes((UI.auth || {}).rol)) { tick(); R.save(); } watchOffers(); if (!typingNow() && !MODAL) renderApp(); }, 200); };
  R.listen(() => { watchOffers(); if (typingNow()) return; renderApp(); });
  if (location.hash.startsWith('#/client/')) { UI.auth = UI.auth || { rol: 'client', nume: 'Client' }; UI.role = 'client'; UI.client = decodeURIComponent(location.hash.slice(9)); UI.view = 'pagina'; }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  watchOffers(); renderApp();
});
