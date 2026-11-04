/* Planul de operare (04.11.2026): capitole, de bifat, de rezolvat, neclare. Bifele se țin în baza comună (planop). */
const PLAN_OPERARE = {
  actualizat: '04.11.2026',
  arhitectura: [
    ['Site', 'Clientul plătește pe site; funcția comanda-site aduce comanda în platformă. Starea și documentele se întorc prin livrare-site.'],
    ['Platforma', 'Pagini statice cu toate datele ca rânduri JSON în platforma_docs (Supabase), sincronizate în timp real. Roluri: Admin, Operator, Tehnic, Sales, Plăți, Specialist.'],
    ['Pașii', 'Fiecare serviciu are un lanț de pași cu dependențe (data.js, CH). Un pas e automat, de obținut document, de verificat sau de combinat.'],
    ['Dispecerul', 'Funcția „dispecer” rulează la un minut prin pg_cron, cu același cod ca browserul (bucketul privat „cod”; se republică cu publica_motor.py). Scrie doar ce s-a schimbat.'],
    ['Notificări', 'Web Push (VAPID): serverul anunță specialistul la o ofertă nouă și operatorul la o comandă plătită, chiar cu aplicația închisă.'],
    ['Documente', 'Bucketul privat „documente”, cu linkuri semnate 10 minute. Cititorul le deschide în aplicație.'],
    ['Text din documente', 'Rulează în browser: pdf.js pentru text digital, Tesseract (română) pentru scanuri. Documentul nu pleacă la un serviciu extern. Rezultatul stă în colecția „ocr”.'],
    ['Aplicația clientului', 'Cartea Casei trimite cereri în tabelul „cereri”, vizibile la Întrebări și cereri.']
  ],
  capitole: [
    { t: 'Operator: lista și pașii', d: 'Operatorul deschide o singură coadă și merge din pas în pas.', items: [
      { id: 'op1', tip: 'bifa', ok: true, t: 'Interfața Operator, separată de cele 20 de intrări ale meniului de admin' },
      { id: 'op2', tip: 'bifa', ok: true, t: '„De lucrat”: o singură coadă, în ordinea urgenței, cu un buton pe rând' },
      { id: 'op3', tip: 'bifa', ok: true, t: 'Preluarea comenzii, cu cine și când' },
      { id: 'op4', tip: 'bifa', ok: true, t: 'Operatorul deschide pasul, pune documentul și trimite mai departe (înainte nu putea)' },
      { id: 'op5', tip: 'bifa', ok: true, t: '„Copiază cererea” pentru specialistul lucrat prin mesaj' },
      { id: 'op6', tip: 'bifa', ok: true, t: 'După un pas terminat, se deschide singur pasul următor' },
      { id: 'op7', tip: 'rezolva', t: 'Primul cont de operator și un test cu o comandă reală', d: 'Se creează din Conturi.' }
    ] },
    { t: 'Flux vizibil', d: 'Ca la urmărirea unui colet: tot drumul și punctul curent.', items: [
      { id: 'fx1', tip: 'bifa', ok: true, t: 'Fluxul pe pagina comenzii, cu etape, date și etapa curentă' },
      { id: 'fx2', tip: 'bifa', ok: true, t: 'Fluxul la specialist, cu „aici ești”, fără numele altora' },
      { id: 'fx3', tip: 'bifa', ok: true, t: 'Raportul cu 35 de pași se vede în câteva etape; cei automați se adună' },
      { id: 'fx4', tip: 'bifa', ok: true, t: 'Același flux pe capitolele acestui plan' },
      { id: 'fx5', tip: 'bifa', ok: true, t: 'Fluxul pentru client pe site: Plătită, Preluată, În lucru cu numărul de pași, Livrată', d: 'De verificat pe prima comandă reală. Pagina publică de test nu e încă republicată.' }
    ] },
    { t: 'Listă și filtre', items: [
      { id: 'fl1', tip: 'bifa', ok: true, t: 'Numărători care se apasă: noi, în lucru, probleme, neplătite, plătite azi, livrate' },
      { id: 'fl2', tip: 'bifa', ok: true, t: 'Filtre: tip, plată, la cine, interval de date, pe lângă etapă, județ și căutare' },
      { id: 'fl3', tip: 'rezolva', t: 'Filtrele rămân pe dispozitivul operatorului, fără vederi salvate', d: 'De adăugat dacă sunt cerute în lucru.' }
    ] },
    { t: 'Documente și text', d: 'PDF, poză sau text, deschise în aplicație și transformate în text dintr-un buton.', items: [
      { id: 'dc1', tip: 'bifa', ok: true, t: 'Cititor în aplicație pentru PDF, poze și text' },
      { id: 'dc2', tip: 'bifa', ok: true, t: 'Un buton „În text”, care pornește imediat și lucrează în fundal' },
      { id: 'dc3', tip: 'bifa', ok: true, t: 'Ștergerea fișierului păstrează capturi până la textul complet' },
      { id: 'dc4', tip: 'bifa', ok: true, t: 'Documentele care merg la client nu se pot șterge' },
      { id: 'dc5', tip: 'bifa', ok: true, t: 'Documentele pașilor anteriori apar în pasul curent' },
      { id: 'dc6', tip: 'bifa', ok: true, t: 'Extrasul încărcat trece singur în text; verificarea compară datele cu PDF-ul', d: 'Pasul așteaptă textul maximum 10 minute, ca să nu țină comanda pe loc.' },
      { id: 'dc7', tip: 'rezolva', t: 'Transformarea rulează doar cât e deschisă fila', d: 'Se reia la redeschidere. Pentru închidere completă e nevoie de un serviciu pe server.' },
      { id: 'dc8', tip: 'neclar', t: 'Calitatea pe extrase CF reale', d: 'Pe Drive nu am găsit extrase reale. Testat doar pe un scan creat de noi. Parserul de câmpuri e netestat pe documente reale.' }
    ] },
    { t: 'Întrebările clienților', items: [
      { id: 'cl1', tip: 'bifa', ok: true, t: 'Întrebări, cereri de ofertă și cereri din aplicație într-un singur loc' },
      { id: 'cl2', tip: 'rezolva', t: 'Cheia Resend (RESEND_API_KEY) în proiectul site-ului', d: 'Canalul e gata, doar pentru comenzile de pe site. Fără cheie, mesajul rămâne „neconfigurat”. Cheia o pune Manu.' },
      { id: 'cl3', tip: 'bifa', ok: true, t: '„Ai o întrebare despre comandă?” în urmărirea de pe site; ajunge la Întrebări și cereri' }
    ] },
    { t: 'Motorul pe server', d: 'Cel mai mare risc: dacă nimeni nu are platforma deschisă, comenzile plătite stau.', items: [
      { id: 'sv1', tip: 'bifa', ok: true, t: 'Pornirea comenzilor, oferirea pașilor și termenele rulează pe server, la un minut', d: 'Testat cu o comandă de probă trimisă de la site, fără nicio filă deschisă.' },
      { id: 'sv2', tip: 'bifa', ok: true, t: 'Notificări cu aplicația închisă (Web Push), partea de server și de aplicație' },
      { id: 'sv4', tip: 'rezolva', t: 'Platforma pe o adresă publică HTTPS, apoi test pe un telefon real', d: 'Fără ea, specialiștii nu pot intra, iar notificările nu pot fi încercate pe telefon.' },
      { id: 'sv3', tip: 'rezolva', t: 'Textul documentelor într-un tabel separat când crește volumul', d: 'Acum se încarcă la pornire, împreună cu celelalte date.' }
    ] },
    { t: 'Curățenie', d: 'Propuneri. Nimic nu se scoate fără decizia lui Manu, pe element.', items: [
      { id: 'cu1', tip: 'bifa', ok: true, t: 'Ascunse în producție: „Comandă de test”, „fișier de test”, „completează de test”' },
      { id: 'cu2', tip: 'bifa', ok: true, t: 'Legătura către site dusă de la v40 la v41' },
      { id: 'cu3', tip: 'neclar', t: 'Panou și De lucrat la admin: rămân amândouă?', d: 'Propunere: De lucrat pentru acțiuni, Panou doar pentru imagine de ansamblu.' },
      { id: 'cu4', tip: 'rezolva', t: 'schema.sql nu mai descrie baza reală', d: 'Tabelele normalizate au fost înlocuite de platforma_docs. Propunere: mutare în arhivă.' },
      { id: 'cu5', tip: 'bifa', ok: true, t: 'Site: scos textul demo; în textele legale, „[STRIPE / NETOPIA]” a devenit Stripe', d: 'Formularea legală rămâne de confirmat cu avocatul.' },
      { id: 'cu8', tip: 'neclar', t: 'Site: listă de așteptare fără buton și handlerul data-intent', d: 'Cod mort, nevăzut de client. Se scoate doar la decizia lui Manu.' },
      { id: 'cu6', tip: 'rezolva', t: 'Site: 5 servicii apar și cu preț, și la „fără preț fix”' },
      { id: 'cu7', tip: 'rezolva', t: 'Site: pagină de 2,26 MB, cu imagini încorporate în HTML' }
    ] },
    { t: 'Decizii neclare', d: 'Am ales o variantă ca lucrul să meargă; se poate schimba.', items: [
      { id: 'dz1', tip: 'neclar', t: 'Pașii ajung la specialist automat sau prin operator?', d: 'Am păstrat ambele: oferirea automată rămâne, iar operatorul poate atribui și pune documentul.' },
      { id: 'dz2', tip: 'neclar', t: 'Livrarea pleacă singură după ultimul pas?', d: 'Acum da, după verificarea finală. Dacă operatorul trebuie să apese „Trimite”, se adaugă o etapă.' },
      { id: 'dz3', tip: 'neclar', t: 'Mai mulți operatori: fiecare cu comenzile lui sau coadă comună?', d: 'Am ales coada comună, cu numele celui care a preluat.' },
      { id: 'dz4', tip: 'neclar', t: 'Cât se păstrează documentele și textele', d: 'Trebuie stabilit cu avocatul, pentru GDPR. Textul unui CF conține date personale.' },
      { id: 'dz5', tip: 'neclar', t: 'Ce vede specialistul din documentele pașilor anteriori', d: 'Am ales: doar documentele pașilor de care depinde pasul lui.' }
    ] }
  ]
};
