/* Platforma de operare · dosare pentru specialiști (CPE, evaluare, opinie juridică/notarială).
   Noi pregătim dosarul (date, documente, poze, bife) cât mai aproape de raportul final; specialistul verifică, completează ce ține de el și semnează.
   Modelele pornesc de la documente reale (CPE Doset-PEC 2023 apartament + casă, raport de evaluare SEV, opiniile notariale BCR și ING completate)
   și de la textele din legislatie/texte. Etichete: [V] articol citit la noi · [D] dedus · [E] de confirmat (text lipsă la noi). */
'use strict';

/* sursa unei date: cf = extrasul CF · motor = noi, automat · client = de la client · teren = agentul de teren · spec = doar specialistul */
const DZ_SURSA = { cf: 'din CF', motor: 'noi (automat)', client: 'client', teren: 'agent teren', spec: 'specialist' };
const DZ_NOI = ['cf', 'motor', 'client', 'teren'];

const DOSAR_MODELE = {
  cpe: {
    nume: 'Certificat de performanță energetică (CPE)',
    cine: 'Auditor energetic pentru clădiri atestat MDLPA (gradul I: toate clădirile; gradul II: locuințe [E])',
    temei: 'L372/2005 art. 3 pct. 23, art. 21(2), art. 30(1) [V]; metodologia Mc 001-2022 [temei lipsă]; Ordin MDLPA 348/2026 [E]',
    model: 'CPE Doset-PEC 2023: pagina 1 (indicatori, clasă), Anexa 1 (măsuri), Anexa 2 (date clădire și instalații), poze, atestat auditor, releveu (RLV)',
    date: [
      ['adresa', 'Adresa imobilului', 'cf', 1], ['cf', 'Nr. carte funciară', 'cf', 1], ['nr_cad', 'Nr. cadastral / topografic', 'cf', 1],
      ['gps', 'Coordonate GPS (lat x long)', 'motor', 1], ['scop', 'Scopul CPE', 'client', 1, ['vânzare', 'închiriere', 'recepție construcție nouă', 'renovare majoră', 'informare']],
      ['tip_cladire', 'Tipul clădirii', 'client', 1, ['existentă', 'nouă finalizată', 'existentă nefinalizată']],
      ['categorie', 'Categoria', 'cf', 1, ['bloc de locuințe (apartament)', 'casă individuală', 'casă înșiruită/cuplată', 'alt tip']],
      ['an', 'Anul construcției / ultimei renovări majore', 'client', 1], ['regim', 'Regim de înălțime (ex. S+P+4E+M)', 'teren', 1], ['etaj', 'Etajul apartamentului', 'cf', 0],
      ['structura', 'Structura', 'teren', 1, ['zidărie portantă', 'cadre beton armat', 'pereți structurali beton armat', 'panouri mari', 'lemn', 'metalică', 'alt tip']],
      ['zona_clim', 'Zona climatică (Timiș: II [E])', 'motor', 1], ['zona_eol', 'Zona eoliană', 'motor', 1],
      ['arie_utila', 'Aria utilă (mp) — din CF/releveu', 'cf', 1], ['arie_locuibila', 'Aria locuibilă (mp)', 'cf', 0], ['h_libera', 'Înălțimea liberă (m)', 'teren', 1],
      ['pereti', 'Pereți exteriori: material + grosime (cm)', 'teren', 1], ['izolatie', 'Izolație exterioară: tip + grosime (cm) / fără', 'teren', 1],
      ['tamplarie', 'Tâmplărie: material, nr. camere profil, tip geam', 'teren', 1],
      ['inc_sursa', 'Încălzire: sursa', 'teren', 1, ['centrală proprie gaz', 'termoficare', 'electric', 'pompă de căldură', 'sobe', 'mixt']],
      ['inc_putere', 'Centrala: putere (kW) + an fabricație (de pe plăcuță)', 'teren', 1], ['corpuri', 'Corpuri de încălzire: tip + număr total', 'teren', 1],
      ['reglaj', 'Robinete termostatate / repartitoare / contor căldură', 'teren', 0],
      ['acc_sursa', 'Apă caldă de consum: sursa', 'teren', 1, ['centrala proprie', 'boiler electric', 'termoficare', 'instant', 'solar + apoint']],
      ['sanitare', 'Obiecte sanitare pe tipuri (lavoar, cadă, duș, WC, spălător, mașini)', 'teren', 1],
      ['racire', 'Răcire: nr. aparate AC + putere / nu există', 'teren', 1], ['ventilare', 'Ventilare mecanică / recuperator', 'teren', 0],
      ['iluminat', 'Iluminat', 'teren', 1, ['LED', 'mixt', 'fluorescent', 'incandescent']], ['sre', 'Surse regenerabile (PV, solar termic, pompă de căldură)', 'teren', 0],
      ['consum', 'Consum real 12 luni (gaz m³ / kWh) — din facturi', 'client', 0],
      ['clasa', 'Clasa energetică + consum specific (kWh/m²an)', 'spec', 1], ['co2', 'Emisii CO₂ (kg/m²an)', 'spec', 1], ['masuri', 'Măsuri recomandate (Anexa 1)', 'spec', 1],
      ['nr_cpe', 'Nr. CPE + cod unic MDLPA + data', 'spec', 1]
    ],
    docObl: [
      ['extras_cf', 'Extras CF pentru informare (suprafețe, nr. cadastral)', 'L7/1996; datele din Anexa 2'],
      ['act_prop', 'Actul de proprietate', 'identificare proprietar/solicitant'],
      ['releveu', 'Releveu / plan (RLV) — din documentația cadastrală sau de intabulare', 'aria de referință, volumul și anvelopa se calculează din geometrie [D]; fără el auditorul îl desenează la fața locului']
    ],
    docSup: [
      ['cpe_vechi', 'CPE anterior', 'dacă e în valabilitate (10 ani) și nu a fost renovare majoră, nu trebuie altul — art. 21(2) [V]', { bife: [['cpe_valabil', 'CPE-ul anterior e în valabilitate și nu a fost renovare majoră → nu e nevoie de CPE nou', 'L372 art. 21(2) [V]', 'motor']] }],
      ['carte_tehnica', 'Cartea tehnică a construcției', 'construcții după 1995 — date de proiect (straturi, izolații)'],
      ['ac_pv', 'Autorizație de construire + PV de recepție', 'construcție nouă', { bife: [['pv_cpe', 'PV de recepție are atașată copia CPE (altfel e nul de drept)', 'L372 art. 23(2) [V]', 'motor']] }],
      ['reabilitare', 'Documentația de reabilitare termică a blocului', 'blocuri reabilitate — grosimea izolației fără sondaj'],
      ['fisa_centrala', 'Fișa tehnică / cartea centralei, verificarea ISCIR', 'putere și randament exacte'],
      ['facturi', 'Facturi energie/gaz 12 luni', 'control de plauzibilitate al consumului calculat'],
      ['proiect_pv', 'Documentația panourilor fotovoltaice / prosumator', 'surse regenerabile']
    ],
    poze: [
      ['fatada', 'Fațada principală, cu intrarea, tot blocul/casa în cadru', 'Din trotuarul opus, telefonul vertical; să se vadă toate etajele și acoperișul.', 'Anexa 2: regim de înălțime, structură, izolație'],
      ['fatade_alte', 'Celelalte fațade (casă: toate 4; apartament: fațada cu ferestrele lui)', 'Câte o poză pe latură; notează orientarea (N/S/E/V).', 'anvelopa, orientarea ferestrelor'],
      ['izolatie', 'Grosimea peretelui și a izolației, cu ruleta', 'La glaful unei ferestre deschise sau la o priză scoasă; ruleta să se citească.', 'rezistența termică a pereților'],
      ['ferestre', 'Fiecare tip de fereastră: profilul + geamul', 'Fereastra deschisă, profilul în secțiune (camerele se văd); eticheta sau distanțierul geamului.', 'tâmplăria (U, nr. camere, tip geam)'],
      ['camere', 'Fiecare cameră, din colț, tot spațiul', 'Câte o poză pe cameră, din colțul opus ușii.', 'verificarea releveului, ariile'],
      ['baie', 'Fiecare baie: toate obiectele sanitare în cadru', 'Lavoar, cadă/duș, WC, bideu în aceeași poză sau în 2 poze.', 'Anexa 2 cere numărul de obiecte sanitare pe tipuri → consumul de apă caldă (L372 art. 6(2) lit. b [V])'],
      ['bucatarie', 'Bucătăria: spălător, plită, mașina de vase', 'Să se vadă tipul plitei (gaz/electric).', 'puncte de consum a.c.c., preparare pe plită'],
      ['centrala', 'Centrala / boilerul întreg + plăcuța de identificare', 'Plăcuța de aproape, lizibilă: model, putere kW, an.', 'sursa de încălzire și a.c.c., putere, randament (L372 art. 6(2) lit. a, b [V])'],
      ['radiatoare', 'Corpurile de încălzire (câte unul din fiecare tip) + robinetul', 'Să se vadă dacă au robinet termostatat; numără-le pe toate.', 'Anexa 2: număr corpuri statice, elemente de reglaj'],
      ['contoare', 'Contoarele: gaz, energie electrică, repartitoare/contor căldură', 'Cadranul lizibil.', 'contor de căldură/repartitoare; plauzibilitatea consumului'],
      ['ac', 'Aparatele de aer condiționat (interior + exterior, plăcuța)', 'Doar dacă există.', 'instalația de răcire'],
      ['iluminat', 'Corpurile de iluminat (tipul becurilor)', 'O poză reprezentativă.', 'sistemul de iluminat'],
      ['sre', 'Panouri PV / solare, pompă de căldură (+ plăcuța)', 'Doar dacă există.', 'surse regenerabile'],
      ['pod_subsol', 'Pod / mansardă / subsol: planșeul spre spațiul neîncălzit', 'Casă: obligatoriu; bloc: doar ultimul etaj/parter.', 'planșee spre neîncălzit, izolație'],
      ['conducte', 'Conducte în spații neîncălzite (subsol, casa scării)', 'Să se vadă dacă sunt izolate.', 'Anexa 2: conducte în spații neîncălzite']
    ],
    bife: [
      ['scop_obligatoriu', 'CPE obligatoriu pentru scop: vânzare/închiriere/recepție/renovare majoră', 'L372 art. 21(1) lit. a [V]', 'motor'],
      ['nu_exceptat', 'Clădirea nu e exceptată (industrial, agricol, garaj exterior, deschisă pe laturi; < 50 mp independentă)', 'L372 art. 8 [V]', 'motor'],
      ['auditor_atestat', 'Auditorul are atestat MDLPA valabil, grad potrivit tipului de clădire, legitimația vizată (din 5 în 5 ani)', 'L372 art. 30(1) [V]; Ordin 348/2026 [E]', 'motor'],
      ['date_teren', 'Datele de teren confirmate de auditor (vizită sau apel video live + pozele de mai jos)', 'Mc 001 [temei lipsă] — riscul datelor eronate e al auditorului: art. 36(1) lit. c, art. 38 [V]', 'spec'],
      ['cod_unic', 'CPE înscris cu cod unic MDLPA în registrul auditorului', 'L372 art. 31(1), art. 36(1) lit. a [V]', 'spec'],
      ['copie_cumparator', 'Copia CPE pusă la dispoziția cumpărătorului înainte de contract (altfel nulitate relativă)', 'L372 art. 22(1), (4) [V]', 'client'],
      ['anunt', 'Anunțul de vânzare/închiriere conține indicatorii din CPE', 'L372 art. 24, art. 36(1) lit. m [V]', 'client']
    ],
    sectiuni: [
      ['Date privind identificarea CPE și a auditorului', ['nr_cpe']],
      ['Date privind imobilul certificat', ['adresa', 'cf', 'nr_cad', 'gps', 'categorie', 'tip_cladire', 'an', 'regim', 'etaj', 'structura', 'zona_clim', 'zona_eol', 'arie_utila', 'arie_locuibila', 'h_libera', 'scop']],
      ['Anvelopa', ['pereti', 'izolatie', 'tamplarie']],
      ['Instalații (Anexa 2)', ['inc_sursa', 'inc_putere', 'corpuri', 'reglaj', 'acc_sursa', 'sanitare', 'racire', 'ventilare', 'iluminat', 'sre', 'consum']],
      ['Performanța energetică (calcul auditor)', ['clasa', 'co2']],
      ['Anexa 1 — măsuri recomandate', ['masuri']]
    ],
    semneaza: 'Auditor energetic pentru clădiri — semnătură și ștampilă'
  },

  evaluare: {
    nume: 'Raport de evaluare (ANEVAR)',
    cine: 'Evaluator autorizat, membru ANEVAR înscris în Tabloul Uniunii, cu legitimație valabilă la data evaluării',
    temei: 'OG 24/2011 [temei lipsă: fișierul de la noi e greșit]; Standardele de evaluare a bunurilor (SEV 100–104, 230) [E]',
    model: 'Raport de evaluare teren + casă în construcție: Partea I termeni de referință, Partea II proprietatea, CMBU, abordări piață/cost, reconciliere, anexe',
    date: [
      ['client', 'Clientul', 'client', 1], ['destinatar', 'Destinatarul raportului', 'client', 1],
      ['scop', 'Scopul evaluării', 'client', 1, ['garantarea unui împrumut (bancă)', 'informarea proprietarului', 'partaj', 'instanță', 'executare silită', 'raportare financiară']],
      ['banca', 'Banca (dacă e garanție) — evaluatorul trebuie să fie pe lista ei [E]', 'client', 0],
      ['tip_valoare', 'Tipul valorii', 'motor', 1, ['valoare de piață', 'valoare de lichidare', 'valoare de investiție']],
      ['data_eval', 'Data evaluării', 'spec', 1], ['data_insp', 'Data inspecției + cine a inspectat', 'spec', 1], ['evaluator', 'Evaluator: nume, legitimație ANEVAR, membru corporativ', 'spec', 1],
      ['adresa', 'Adresa', 'cf', 1], ['cf', 'Nr. CF', 'cf', 1], ['nr_cad', 'Nr. cadastral', 'cf', 1], ['proprietar', 'Proprietar(i) (inițiale în raportul nostru)', 'cf', 1],
      ['juridic', 'Situația juridică: drept, sarcini, ipoteci, notări (Partea II–III CF)', 'cf', 1],
      ['amplasament', 'Amplasament, vecinătăți, căi de acces', 'motor', 1], ['utilitati', 'Utilități (apă, canal, gaz, curent)', 'teren', 1],
      ['teren', 'Teren: suprafață, front stradal, formă, topografie', 'cf', 1], ['urbanism', 'Urbanism: zonă PUG/PUZ, POT/CUT, regim înălțime', 'motor', 1],
      ['constructie', 'Construcție: Sc / Sd / Su, regim, an, structură, finisaje, stare', 'teren', 0],
      ['piata', 'Analiza pieței: cerere, ofertă, echilibru', 'motor', 1], ['comparabile', 'Comparabile (min. 3, cu sursă și dată)', 'motor', 1],
      ['interval', 'Interval de preț estimat din comparabile (al nostru, nu „evaluare”)', 'motor', 0],
      ['ipoteze', 'Ipoteze și ipoteze speciale (ex. construcție neintabulată)', 'motor', 1],
      ['cmbu', 'Cea mai bună utilizare (CMBU)', 'spec', 1], ['ab_piata', 'Abordarea prin piață (grila de ajustări)', 'spec', 1], ['ab_cost', 'Abordarea prin cost (CIN)', 'spec', 0], ['ab_venit', 'Abordarea prin venit', 'spec', 0],
      ['valoare', 'Valoarea finală + curs EUR + data', 'spec', 1]
    ],
    docObl: [
      ['extras_cf', 'Extras CF pentru informare (bancă: de regulă ≤ 30 zile [E])', 'drept, suprafață, sarcini'],
      ['act_prop', 'Actul de proprietate', 'dreptul evaluat'],
      ['plan_amp', 'Plan de amplasament și delimitare', 'identificare, suprafață teren'],
      ['planuri', 'Planuri/releveu pe niveluri', 'suprafețe construite/utile']
    ],
    docSup: [
      ['ac_pv', 'Autorizație de construire + PV de recepție + memoriu', 'construcții; în curs de execuție → ipoteză specială', { bife: [['ip_speciala', 'Construcția neintabulată/în curs e tratată ca ipoteză specială, cu AC atașată', 'SEV — ipoteze speciale [E]', 'spec']] }],
      ['cu', 'Certificat de urbanism / extras PUG-PUZ', 'teren — CMBU'],
      ['chirii', 'Contracte de închiriere în vigoare', 'abordarea prin venit', { date: [['chirie', 'Chiria lunară + durata contractului', 'client', 1]] }],
      ['cpe', 'Certificat energetic', 'descriere, clasă'],
      ['devize', 'Devize / facturi lucrări recente', 'stadiu fizic, cost'],
      ['cert_fiscal', 'Certificat de atestare fiscală', 'valoare de impozitare']
    ],
    poze: [
      ['strada', 'Strada, în ambele sensuri, cu imobilul', 'De la poartă spre stânga și spre dreapta.', 'amplasament, vecinătăți'],
      ['nr_postal', 'Numărul poștal / plăcuța străzii', 'Lizibil.', 'identificarea imobilului'],
      ['fatade', 'Fațadele (toate laturile accesibile)', 'Câte o poză pe latură.', 'descrierea construcției, stare'],
      ['acces', 'Accesul (poartă, alee, parcare)', '', 'căi de acces'],
      ['teren_limite', 'Terenul: limitele, gardurile, colțurile', 'Din colțuri spre interior.', 'formă, front, delimitare'],
      ['camere', 'Fiecare cameră', 'Din colț, tot spațiul.', 'compartimentare, finisaje'],
      ['bai_bucatarie', 'Băile și bucătăria', '', 'dotări, finisaje'],
      ['finisaje', 'Pardoseli, tâmplărie, uși (detaliu)', '', 'nivel de finisaj'],
      ['instalatii', 'Centrala, tabloul electric, contoarele', '', 'dotare cu utilități'],
      ['defecte', 'Defectele: fisuri, igrasie, infiltrații, degradări', 'Cu un obiect pentru scară (pix, ruletă).', 'stare tehnică, ajustări'],
      ['anexe', 'Anexe: garaj, magazie, piscină', 'Doar dacă există.', 'construcții accesorii'],
      ['vedere', 'Vederea de la fereastră / din curte', '', 'priveliște, vecinătăți']
    ],
    bife: [
      ['ev_anevar', 'Evaluatorul e membru titular ANEVAR, în Tabloul Uniunii, cu legitimație valabilă', 'OG 24/2011 [temei lipsă]', 'motor'],
      ['ev_banca', 'Dacă e pentru bancă: evaluatorul e pe lista băncii; raportul intră în baza de date ANEVAR [E]', 'cerință bancă [E]', 'motor'],
      ['ev_asig', 'Asigurare de răspundere profesională valabilă', '[E]', 'motor'],
      ['ev_indep', 'Fără conflict de interese cu părțile', 'SEV [E]', 'spec'],
      ['ev_insp', 'Inspecția a fost făcută personal de evaluator (data)', 'SEV; în model: „inspectate personal de către evaluator” [D]', 'spec'],
      ['ev_juridic', 'Situația juridică verificată pe CF (nu doar pe declarația clientului)', 'Cod civil art. 883 [V]', 'motor'],
      ['ev_comp', 'Minimum 3 comparabile, cu sursă și dată', 'SEV [E]', 'motor'],
      ['ev_termen', 'Cuvântul „evaluare” apare doar în raportul evaluatorului; noi scriem „interval de preț estimat”', 'OG 24/2011 [E]; CLAUDE.md §3', 'motor']
    ],
    sectiuni: [
      ['Partea I — Termeni de referință', ['client', 'destinatar', 'scop', 'banca', 'tip_valoare', 'data_eval', 'data_insp', 'evaluator', 'ipoteze']],
      ['Partea II — Proprietatea evaluată', ['adresa', 'cf', 'nr_cad', 'proprietar', 'juridic', 'amplasament', 'utilitati', 'teren', 'urbanism', 'constructie']],
      ['Analiza pieței', ['piata', 'comparabile', 'interval']],
      ['Evaluarea (evaluator)', ['cmbu', 'ab_piata', 'ab_cost', 'ab_venit', 'valoare']]
    ],
    semneaza: 'Evaluator autorizat ANEVAR — semnătură, ștampilă, nr. legitimație'
  },

  opinie: {
    nume: 'Opinie juridică / notarială privind imobilul',
    cine: 'Avocat (consultație scrisă, L51/1995 art. 3(1) lit. a [V]) sau notar public (opinia notarială cerută de bănci, L36/1995 [E])',
    temei: 'Cod civil art. 883 [V]; L7/1996 [V]; L372/2005 art. 22–23 [V]; L10/2001, L112/1995, L18/1991, L422/2001, L85/2014 (în registru)',
    model: 'Unificat din: opinia notarială BCR (documente → descriere → concluzie a/b/c → măsuri) și opinia notarială ING (A proprietate, B identitate, II.1 ramuri a–q după modul de dobândire, II.2–II.4, constatări obligatorii); ramurile care nu se aplică ies automat „nu este cazul” (ca în opinia nr. 31/2017)',
    date: [
      ['format', 'Formatul cerut', 'client', 1, ['generic (cumpărător)', 'BCR', 'ING', 'altă bancă']],
      ['beneficiar', 'Beneficiarul opiniei (cumpărător / bancă)', 'client', 1],
      ['descriere', 'Descrierea imobilului: suprafețe, camere, cote părți, accesorii', 'cf', 1], ['adresa', 'Adresa', 'cf', 1],
      ['cf', 'Nr. CF + localitate', 'cf', 1], ['nr_cad', 'Nr. cadastral / topografic', 'cf', 1], ['incheiere', 'Încheierea de intabulare (nr./dată)', 'cf', 1],
      ['proprietar', 'Proprietar(i) / constituitor (inițiale)', 'cf', 1],
      ['mod', 'Modul de dobândire (ultimul act)', 'cf', 1, ['vânzare-cumpărare', 'schimb', 'moștenire', 'donație', 'întreținere', 'DL 61/1990', 'Legea 112/1995', 'hotărâre judecătorească', 'adjudecare', 'Legea 18/1991', 'construire (AC + PV)', 'fuziune/divizare', 'Legea 15/1990', 'dare în plată']],
      ['act', 'Actul de dobândire: nr., dată, notar/emitent, părți', 'cf', 1],
      ['data_extras', 'Data extrasului CF (BCR: max. 15 zile lucrătoare la emiterea opiniei)', 'motor', 1],
      ['sarcini', 'Partea III CF: ipoteci, sechestre, interdicții, notări de litigii', 'cf', 1],
      ['cereri_curs', 'Cereri de înscriere în curs la OCPI (registrul de intrare)', 'motor', 1],
      ['stare_civila', 'Starea civilă / regimul matrimonial al proprietarului', 'client', 1], ['semnatar', 'Semnatarul: identitate, capacitate, procură', 'client', 1],
      ['pret', 'Prețul/sulta din actul de proprietate achitat integral?', 'client', 1, ['da', 'nu', 'neclar']],
      ['concluzie', 'Concluzia (a: proprietate deplină, fără riscuri / b: deplină, cu riscuri / c: nu sunt îndeplinite condițiile)', 'spec', 1, ['a', 'b', 'c']],
      ['consecinte', 'Consecințele juridice semnalate (pentru b/c)', 'spec', 0], ['masuri', 'Măsuri propuse (ridicare interdicție, procură, plata diferenței etc.)', 'spec', 0]
    ],
    docObl: [
      ['extras_cf', 'Extras CF pentru informare / copie CF', 'II.3 dovada intabulării — L7/1996 [V]'],
      ['act_prop', 'Actul de proprietate (ultimul act translativ)', 'II.1 — se completează integral ramura lui'],
      ['cadastru', 'Documentația cadastrală', 'II.2 — obligatoriu în modelul ING'],
      ['cert_fiscal', 'Certificat de atestare fiscală', 'BCR lit. g; vânzare: și pentru cumpărător (OUG 7/2026)']
    ],
    docSup: [
      ['cert_most', 'Certificat de moștenitor', 'moștenire', { bife: [['most_2011', 'Eliberat înainte de 01.10.2011? Dacă da: se verifică și titlul defunctului (și al autorilor lui)', 'model ING II.1 c', 'spec']] }],
      ['ac_pv', 'Autorizație de construire + PV de recepție', 'construire', { bife: [['pv_cpe', 'PV recepționat după 19.07.2013 are copia CPE (altfel nul de drept)', 'L372 art. 23(2) [V]', 'motor'], ['concesiune', 'Terenul e concesionat din domeniul public/privat al statului/UAT? (bun de retur → nu se acceptă în garanție)', 'model ING II.1 m', 'spec']] }],
      ['cpe', 'Certificat de performanță energetică', 'vânzare după 19.07.2013', { bife: [['cpe_vanz', 'Vânzare după 19.07.2013: CPE prezentat și transmis în original cumpărătorului', 'L372 art. 22 [V]; model ING II.1 a', 'motor']] }],
      ['hotarare', 'Hotărâre judecătorească', 'dobândire prin hotărâre', { bife: [['hot_def', 'Hotărârea e definitivă', 'model ING II.1 i', 'spec']] }],
      ['procura', 'Procură autentică specială', 'semnează un mandatar'],
      ['stare_civ', 'Certificat de căsătorie / convenție matrimonială', 'bun comun sau propriu'],
      ['adresa_l10', 'Adresa fostei unități de stat + a primăriei că nu există cerere în baza L10/2001', 'Legea 112/1995', { bife: [['l112_adresa', 'Adresele prezentate: nu există cerere de restituire L10/2001 și nici litigiu', 'model ING II.1 g', 'spec']] }],
      ['rnl', 'Extras din Registrul Național al Liberalităților', 'donație', { bife: [['don_sarcini', 'Donația e cu sarcini neîndeplinite? (nu se acceptă)', 'model ING II.1 d', 'spec'], ['don_revocare', 'Există cerere de revocare / de raport înscrisă în CF sau RNL?', 'model ING II.1 d', 'spec'], ['don_soti', 'Donația e între soți?', 'model ING II.1 d', 'spec']] }],
      ['intretinere', 'Act adițional / certificat de moștenitor + declarații (întreținere)', 'contract de întreținere', { bife: [['intr_30', 'Întreținutul a decedat în mai puțin de 30 de zile de la contract? (nu se acceptă)', 'model ING II.1 e', 'spec']] }],
      ['adjudecare', 'Act de adjudecare + PV licitație + adresa executorului', 'adjudecare', { bife: [['adj_contest', 'Termenul de contestație la executare s-a împlinit fără contestații; încheierea de intabulare a adjudecatarului', 'model ING II.1 j', 'spec']] }],
      ['insolventa', 'Adresa administratorului judiciar / lichidatorului', 'vânzător persoană juridică în insolvență', { bife: [['insolv', 'Nu există motive de anulare a titlului (L85/2014)', 'model ING II.1 h', 'spec']] }]
    ],
    poze: [
      ['identificare', 'Fațada + numărul poștal (identificarea imobilului din CF)', 'Opțional; ajută la potrivirea CF ↔ teren.', 'descrierea imobilului']
    ],
    bife: [
      ['l10', 'Imobilului îi sunt aplicabile prevederile Legii 10/2001?', 'model ING, constatări a', 'spec'],
      ['l112', 'Îi sunt aplicabile prevederile Legii 112/1995?', 'model ING, constatări b', 'spec'],
      ['l18_10ani', 'Interdicția de înstrăinare de 10 ani (Legea 18/1991)?', 'model ING, constatări c', 'spec'],
      ['l112_10ani', 'Interdicția de înstrăinare de 10 ani (Legea 112/1995)?', 'model ING, constatări d', 'spec'],
      ['monument', 'Monument istoric (Legea 422/2001)?', 'model ING, constatări e', 'motor'],
      ['insolv_gen', 'Sub incidența Legii 85/2014 (insolvență)?', 'model ING, constatări f', 'motor'],
      ['pret_achitat', 'Prețul/sulta din actul de proprietate a fost achitat integral', 'model ING, constatări h', 'spec'],
      ['intabulat', 'Dreptul e intabulat; extrasul CF e recent (BCR: ≤ 15 zile lucrătoare)', 'L7/1996 [V]; model BCR nota 4', 'motor'],
      ['cereri', 'Nu există cereri de înscriere în curs — opozabile oricui', 'Cod civil art. 883(3) [V]', 'motor'],
      ['identitate', 'Condițiile de fond și formă pentru semnare: identitate, capacitate, consimțământ soț, procură', 'model ING, B', 'spec'],
      ['prim_rang', 'Garanția băncii va fi de prim rang (sau rangurile anterioare sunt tot ale băncii)', 'model BCR 3 a', 'spec']
    ],
    sectiuni: [
      ['Imobilul', ['adresa', 'descriere', 'cf', 'nr_cad', 'incheiere', 'proprietar']],
      ['Documente examinate · actul de proprietate', ['mod', 'act', 'data_extras']],
      ['Situația din cartea funciară', ['sarcini', 'cereri_curs']],
      ['Părțile', ['stare_civila', 'semnatar', 'pret']],
      ['Concluzie și măsuri (semnatar)', ['concluzie', 'consecinte', 'masuri']]
    ],
    semneaza: 'Avocat / notar public — semnătură și ștampilă'
  }
};

/* ---------- date ---------- */
const dzAll = () => { if (!R.db.dosare) R.db.dosare = {}; return R.db.dosare; };
function dzModel(d) {
  const M = DOSAR_MODELE[d.tip]; const sup = (d.docs || {});
  const date = M.date.slice(), bife = M.bife.slice();
  M.docSup.forEach((x) => { if (sup[x[0]] && x[3]) { (x[3].bife || []).forEach((b) => bife.push(b)); (x[3].date || []).forEach((y) => date.push(y)); } });
  return { M, date, bife };
}
function dzPrecompleteaza(d) {
  const o = d.comanda ? orderBy(d.comanda) : null; const im = o ? D('imobile')[o.imobile[0]] : null; if (!im) return;
  const fisa = (R.db.fise || {})[im.id] || {};
  const pre = { adresa: [im.adresa, im.uat, im.judet].filter(Boolean).join(', '), cf: im.cf ? im.cf + (im.uat ? ' ' + im.uat : '') : '', nr_cad: im.nr_cad || '', categorie: im.tip === 'apartament' ? 'bloc de locuințe (apartament)' : im.tip === 'casa' ? 'casă individuală' : '' };
  Object.keys(fisa).forEach((k) => { if (typeof fisa[k] === 'string' || typeof fisa[k] === 'number') pre[k] = pre[k] || String(fisa[k]); });
  if (/timi/i.test(im.judet || '') || /timi/i.test(im.uat || '')) pre.zona_clim = 'II [E]';
  if (d.tip === 'opinie') pre.data_extras = pre.data_extras || '';
  d.v = d.v || {}; Object.keys(pre).forEach((k) => { if (pre[k] && !d.v[k]) d.v[k] = pre[k]; });
}
function dzNou(tip, comanda) {
  const d = { id: uid('dz'), tip, comanda: comanda || '', creat: now(), v: {}, docs: {}, extra: [], poze: {}, bife: {}, stare: 'in_pregatire' };
  dzPrecompleteaza(d); dzAll()[d.id] = d; ev('dosar.creat', (UI.auth || {}).nume || 'admin', null, { tip }); return d;
}
/* gradul de pregătire: tot ce e obligatoriu (date, documente, poze, bife); „noi” = ce putem pregăti fără specialist */
function dzScor(d) {
  const { M, date, bife } = dzModel(d);
  const items = [];
  date.filter((x) => x[3]).forEach((x) => items.push([x[2], !!(d.v[x[0]] || '').trim()]));
  M.docObl.forEach((x) => items.push(['client', !!d.docs[x[0]]]));
  M.poze.forEach((x) => items.push(['teren', !!(d.poze[x[0]] || []).length]));
  bife.forEach((x) => items.push([x[3], !!d.bife[x[0]]]));
  const tot = items.length, gata = items.filter((i) => i[1]).length;
  const noi = items.filter((i) => DZ_NOI.includes(i[0]) || i[0] === 'motor');
  return { tot, gata, pct: Math.round(100 * gata / tot), max: Math.round(100 * noi.length / tot), noiGata: noi.filter((i) => i[1]).length, noiTot: noi.length };
}
const dzBar = (p) => { const n = Math.round(p / 10); return '<span class="mono">' + '▰'.repeat(n) + '▱'.repeat(10 - n) + '</span> ' + p + '%'; };

/* ---------- raportul (ciornă pentru specialist) ---------- */
function dzRaport(d) {
  const { M, date, bife } = dzModel(d); const s = dzScor(d);
  const lab = {}; date.forEach((x) => (lab[x[0]] = x));
  const val = (k) => { const x = lab[k]; if (!x) return ''; const v = (d.v[k] || '').trim(); return '<tr><th>' + esc(x[1]) + '</th><td>' + (v ? esc(v) : '<mark>[de completat — ' + DZ_SURSA[x[2]] + ']</mark>') + '</td></tr>'; };
  const used = new Set(); M.sectiuni.forEach((sc) => sc[1].forEach((k) => used.add(k)));
  const rest = date.filter((x) => !used.has(x[0]));
  let h = '<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>' + esc(M.nume) + '</title><style>body{font:14px/1.45 Georgia,serif;max-width:820px;margin:24px auto;padding:0 16px;color:#111}h1{font-size:20px}h2{font-size:15px;border-bottom:1px solid #999;margin-top:22px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}th{width:38%;background:#f3f3f3;font-weight:normal}mark{background:#fff3b0}.mut{color:#666;font-size:12px}.sig{margin-top:40px;border-top:1px solid #000;width:320px;padding-top:4px}</style></head><body>';
  h += '<p class="mut">CIORNĂ pregătită de platformă (' + s.pct + '% gata) — se verifică, se completează și se semnează de specialist. Platforma constată fapte; concluziile aparțin semnatarului.</p>';
  h += '<h1>' + esc(M.nume) + '</h1><p class="mut">Temei: ' + esc(M.temei) + '<br>Model: ' + esc(M.model) + '</p>';
  M.sectiuni.forEach((sc) => { h += '<h2>' + esc(sc[0]) + '</h2><table>' + sc[1].map(val).join('') + '</table>'; });
  if (rest.length) h += '<h2>Date suplimentare</h2><table>' + rest.map((x) => val(x[0])).join('') + '</table>';
  if (d.tip === 'opinie') { const mod = d.v.mod || ''; h += '<h2>II.1 Actul de proprietate — ramuri</h2><table>' + lab.mod[4].map((r) => '<tr><th>' + esc(r) + '</th><td>' + (r === mod ? '<b>se completează integral</b>' : 'nu este cazul') + '</td></tr>').join('') + '</table>'; }
  h += '<h2>Documente examinate</h2><table>' + M.docObl.concat(M.docSup.filter((x) => d.docs[x[0]])).map((x) => '<tr><th>' + esc(x[1]) + '</th><td>' + (d.docs[x[0]] ? esc(d.docs[x[0]]) : '<mark>[lipsește]</mark>') + '</td></tr>').join('') + (d.extra || []).map((x) => '<tr><th>' + esc(x.t) + '</th><td>' + esc(x.f || '') + '</td></tr>').join('') + '</table>';
  h += '<h2>Verificări</h2><table>' + bife.map((b) => '<tr><th>' + esc(b[1]) + '<br><span class="mut">' + esc(b[2]) + '</span></th><td>' + (d.bife[b[0]] ? '☑ ' + esc(d.bife[b[0]] === true ? 'da' : d.bife[b[0]]) : '☐ <mark>[' + DZ_SURSA[b[3]] + ']</mark>') + '</td></tr>').join('') + '</table>';
  h += '<h2>Fotografii atașate</h2><table>' + M.poze.map((p) => { const fs = d.poze[p[0]] || []; return '<tr><th>' + esc(p[1]) + '<br><span class="mut">' + esc(p[3]) + '</span></th><td>' + (fs.length ? fs.map((f) => (DZ_BLOBS[f.id] ? '<img src="' + DZ_BLOBS[f.id] + '" style="max-width:160px;margin:2px">' : '') + '<div class="mut">' + esc(f.nume) + ' · ' + new Date(f.la).toLocaleString('ro-RO') + (f.gps ? ' · GPS ' + esc(f.gps) : '') + '</div>').join('') : '<mark>[lipsește]</mark>') + '</td></tr>'; }).join('') + '</table>';
  h += '<div class="sig">' + esc(M.semneaza) + '</div></body></html>';
  return h;
}
const DZ_BLOBS = {};

/* ---------- interfața ---------- */
function dosareView() {
  const all = Object.values(dzAll()).sort((a, b) => b.creat - a.creat);
  if (UI.f.dz && dzAll()[UI.f.dz]) return dosarDetaliu(dzAll()[UI.f.dz]);
  if (UI.f.dzt === 'poze') return pozeGhidate();
  const cmz = L('comenzi').sort((a, b) => b.nr.localeCompare(a.nr)).slice(0, 40);
  return '<h2>Dosare pentru specialiști</h2><p class="mut">Noi pregătim dosarul (date din CF și din motor, documente, poze ghidate, bife); specialistul îl găsește gata în proporție de 80–99% și completează doar ce ține de semnătura lui.</p>' +
    '<div class="btns">' + btn('dztab', 'Dosare', { id: '', c: 'mic pri' }) + btn('dztab', 'Lista de poze ghidate (agent de teren)', { id: 'poze', c: 'mic' }) + '</div>' +
    sec('Dosar nou', '<div class="frm">' + msel('dz_tip', 'Tipul raportului', Object.keys(DOSAR_MODELE).map((k) => [k, DOSAR_MODELE[k].nume])) + msel('dz_cmd', 'Comanda (precompletează din CF)', [['', '— fără comandă —']].concat(cmz.map((o) => [o.nr, o.nr + ' · ' + imoText(D('imobile')[o.imobile[0]]).replace(/<[^>]+>/g, '')]))) + '</div>' + btn('dznou', 'Creează dosarul', { c: 'pri' })) +
    sec('Dosare în lucru', tbl(['Raport', 'Comandă', 'Gata', 'Noi putem pregăti', ''], all.map((d) => { const s = dzScor(d); return '<tr class="rl" data-a="dzopen" data-id="' + d.id + '"><td>' + esc(DOSAR_MODELE[d.tip].nume) + '</td><td>' + esc(d.comanda || '—') + '</td><td>' + dzBar(s.pct) + '</td><td>până la ' + s.max + '%</td><td>' + btn('dzopen', 'Deschide', { id: d.id, c: 'mic' }) + '</td></tr>'; }))) +
    sec('Modelele', Object.keys(DOSAR_MODELE).map((k) => { const M = DOSAR_MODELE[k]; return '<p><b>' + esc(M.nume) + '</b><br><span class="small">Semnează: ' + esc(M.cine) + '</span><br><span class="small mut">' + M.date.length + ' date · ' + M.docObl.length + ' documente obligatorii + ' + M.docSup.length + ' suplimentare · ' + M.poze.length + ' poze · ' + M.bife.length + ' bife · ' + esc(M.temei) + '</span></p>'; }).join(''));
}
function pozeGhidate() {
  const map = {}; Object.keys(DOSAR_MODELE).forEach((k) => DOSAR_MODELE[k].poze.forEach((p) => { const key = p[1]; map[key] = map[key] || { p, la: [] }; map[key].la.push(k === 'cpe' ? 'CPE' : k === 'evaluare' ? 'evaluare' : 'opinie'); }));
  return '<h2>Lista de poze ghidate</h2><p class="mut">O singură vizită a agentului de teren acoperă toate rapoartele. Fiecare poză se face din aplicație (cameră), cu ora și GPS-ul atașate automat. Coloana „De ce” arată ce câmp din raport alimentează.</p>' + btn('dztab', '← Dosare', { id: '', c: 'mic' }) +
    tbl(['Poza', 'Cum se face', 'De ce (câmpul din raport)', 'Pentru'], Object.values(map).map((x) => '<tr><td><b>' + esc(x.p[1]) + '</b></td><td class="small">' + esc(x.p[2]) + '</td><td class="small">' + esc(x.p[3]) + '</td><td>' + x.la.map((t) => tag(t, 'alb')).join(' ') + '</td></tr>'));
}
function dosarDetaliu(d) {
  const { M, date, bife } = dzModel(d); const s = dzScor(d); const ro = (UI.role === 'specialist');
  const camp = (x) => { const k = x[0], v = d.v[k] || ''; const lbl = esc(x[1]) + (x[3] ? ' *' : '') + ' ' + tag(DZ_SURSA[x[2]], x[2] === 'spec' ? 'galben' : 'gri'); return '<label>' + lbl + (x[4] ? '<select data-dz="v|' + d.id + '|' + k + '"><option value="">—</option>' + x[4].map((o) => '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>' : '<input data-dz="v|' + d.id + '|' + k + '" value="' + esc(v) + '">') + '</label>'; };
  const docRow = (x, obl) => '<tr><td>' + esc(x[1]) + (obl ? ' *' : '') + '<br><span class="small mut">' + esc(x[2]) + '</span></td><td>' + (d.docs[x[0]] ? tag('✓ ' + d.docs[x[0]], 'verde') + ' ' : '') + '<input type="file" data-dz="doc|' + d.id + '|' + x[0] + '"></td></tr>';
  const pozaRow = (p) => { const fs = d.poze[p[0]] || []; return '<tr><td><b>' + esc(p[1]) + '</b><br><span class="small mut">' + esc(p[2]) + '</span></td><td class="small">' + esc(p[3]) + '</td><td>' + (fs.length ? tag(fs.length + ' poze', 'verde') + ' ' : '') + '<input type="file" accept="image/*" capture="environment" multiple data-dz="foto|' + d.id + '|' + p[0] + '"></td></tr>'; };
  const bifa = (b) => '<label class="inl"><input type="checkbox" data-dz="b|' + d.id + '|' + b[0] + '"' + (d.bife[b[0]] ? ' checked' : '') + '> ' + esc(b[1]) + ' <span class="small mut">' + esc(b[2]) + '</span> ' + tag(DZ_SURSA[b[3]], b[3] === 'spec' ? 'galben' : 'gri') + '</label>';
  return '<h2>' + esc(M.nume) + (d.comanda ? ' · ' + esc(d.comanda) : '') + '</h2>' +
    '<p>' + dzBar(s.pct) + ' gata · noi putem duce dosarul până la <b>' + s.max + '%</b> (' + s.noiGata + '/' + s.noiTot + ' din partea noastră), restul e al specialistului.</p>' +
    '<p class="small mut">Semnează: ' + esc(M.cine) + '<br>Temei: ' + esc(M.temei) + '</p>' +
    '<div class="btns">' + btn('dzback', '← Dosare', { c: 'mic' }) + btn('dzpre', 'Reia precompletarea din CF', { id: d.id, c: 'mic' }) + btn('dzrap', 'Vezi raportul (ciornă)', { id: d.id, c: 'mic pri' }) + btn('dzdl', 'Descarcă .doc', { id: d.id, x: 'doc', c: 'mic' }) + btn('dzdl', 'Descarcă .html', { id: d.id, x: 'html', c: 'mic' }) + (ro ? '' : btn('dzdel', 'Șterge dosarul', { id: d.id, c: 'mic war' })) + '</div>' +
    sec('1. Date (* obligatorii)', '<div class="frm">' + date.map(camp).join('') + '</div>') +
    sec('2. Documente obligatorii', tbl(['Document', 'Fișier'], M.docObl.map((x) => docRow(x, true)))) +
    sec('3. Documente suplimentare', '<p class="small mut">Când se încarcă unul, dosarul se adaptează: apar bifele și datele lui.</p>' + tbl(['Document', 'Fișier'], M.docSup.map((x) => docRow(x, false))) +
      '<div class="frm">' + mf('dz_extra_t', 'Alt document (denumire)') + '</div>' + btn('dzextra', 'Adaugă document', { id: d.id, c: 'mic' }) + ((d.extra || []).length ? '<ul>' + d.extra.map((x) => '<li>' + esc(x.t) + (x.f ? ' · ' + esc(x.f) : '') + '</li>').join('') + '</ul>' : '')) +
    sec('4. Poze ghidate', tbl(['Poza', 'De ce', 'Încarcă / fă poza'], M.poze.map(pozaRow))) +
    sec('5. Bife', bife.map(bifa).join('<br>'));
}

/* ---------- acțiuni și câmpuri ---------- */
Object.assign(A, {
  dztab: (d) => { UI.f.dzt = d.id; UI.f.dz = null; },
  dznou: () => { const dz = dzNou(val('dz_tip'), val('dz_cmd')); UI.f.dz = dz.id; },
  dzopen: (d) => { UI.f.dz = d.id; MODAL = null; },
  dzback: () => { UI.f.dz = null; },
  dzpre: (d) => { const z = dzAll()[d.id]; dzPrecompleteaza(z); toast('Precompletat din CF / comandă.'); },
  dzrap: (d) => { const w = window.open('', '_blank'); if (w) { w.document.write(dzRaport(dzAll()[d.id])); w.document.close(); } else toast('Permite ferestrele noi ca să vezi raportul.'); },
  dzdl: (d) => { const z = dzAll()[d.id]; const n = z.tip + '_' + (z.comanda || z.id) + '.' + d.x; dl(n, dzRaport(z), d.x === 'doc' ? 'application/msword' : 'text/html;charset=utf-8'); },
  dzdel: (d) => { if (!confirm('Ștergi dosarul?')) return; delete dzAll()[d.id]; UI.f.dz = null; },
  dzextra: (d) => { const t = val('dz_extra_t').trim(); if (!t) { toast('Scrie denumirea documentului.'); return; } const z = dzAll()[d.id]; z.extra = z.extra || []; z.extra.push({ t, f: '' }); }
});
document.addEventListener('change', (e) => {
  const k = e.target.dataset && e.target.dataset.dz; if (!k) return;
  const [tip, id, key] = k.split('|'); const z = dzAll()[id]; if (!z) return; const el = e.target;
  if (tip === 'v') z.v[key] = el.value;
  else if (tip === 'b') z.bife[key] = el.checked;
  else if (tip === 'doc') { const f = el.files[0]; if (f) z.docs[key] = f.name; }
  else if (tip === 'foto') {
    const files = Array.from(el.files); const add = (gps) => { files.forEach((file) => { const fid = uid('ft'); DZ_BLOBS[fid] = URL.createObjectURL(file); (z.poze[key] = z.poze[key] || []).push({ id: fid, nume: file.name || key + '.jpg', la: now(), gps }); }); R.save(); renderApp(); };
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => add(p.coords.latitude.toFixed(6) + ', ' + p.coords.longitude.toFixed(6)), () => add(''), { timeout: 4000 }); else add('');
    return;
  }
  R.save(); if (tip !== 'v') renderApp();
});
