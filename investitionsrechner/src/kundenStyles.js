/* Gestaltung der Kundenseite: Hellbetongrau und Porsche-Grün */

export const KUNDEN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

.jb {
  --bg: #E3E1DB;
  --papier: #EEECE7;
  --platte: #F6F5F1;
  --tinte: #1D211F;
  --gedaempft: #62665F;
  --linie: #C9C6BD;
  --linie-stark: #A9A69C;
  --gruen: #0C4B33;
  --gruen-hell: #1B6B4A;
  --gruen-auf: #F3F2EC;
  --gruen-weich: rgba(12,75,51,.10);
  --rost: #9B4B2A;
  --rost-weich: rgba(155,75,42,.12);
  --fokus: #0C4B33;
  --korn-deckkraft: .5;
  color-scheme: light;
}
.jb[data-theme="dunkel"] {
  --bg: #111513;
  --papier: #171C19;
  --platte: #1D231F;
  --tinte: #E7E5DF;
  --gedaempft: #9A9E96;
  --linie: #2C332E;
  --linie-stark: #444C46;
  --gruen: #53AB80;
  --gruen-hell: #6CC095;
  --gruen-auf: #0E1411;
  --gruen-weich: rgba(83,171,128,.14);
  --rost: #D58B63;
  --rost-weich: rgba(213,139,99,.14);
  --fokus: #6CC095;
  --korn-deckkraft: .18;
  color-scheme: dark;
}

.jb, .jb * { box-sizing: border-box; }
.jb {
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--tinte);
  background-color: var(--bg);
  min-height: 100vh;
  position: relative;
  -webkit-font-smoothing: antialiased;
}
.jb::before {
  content: "";
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  opacity: var(--korn-deckkraft);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .35  0 0 0 0 .33  0 0 0 .22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.jb > * { position: relative; z-index: 1; }
@media (prefers-reduced-motion: no-preference) { html:has(.jb) { scroll-behavior: smooth; } }
.jb h1, .jb h2, .jb h3 {
  font-family: 'Bricolage Grotesque', 'IBM Plex Sans', sans-serif;
  font-weight: 700;
  letter-spacing: -.02em;
  line-height: 1.08;
  margin: 0;
}
.jb p { margin: 0; }
.jb a { color: inherit; }
.jb :focus-visible { outline: 2px solid var(--fokus); outline-offset: 3px; border-radius: 3px; }
.jb button { font: inherit; color: inherit; cursor: pointer; }

.jb .huelle { width: min(1180px, 100% - 32px); margin-inline: auto; }
.jb .sektion { padding: clamp(56px, 9vw, 112px) 0; border-top: 1px solid var(--linie); }
.jb .sektion-kopf { max-width: 60ch; margin-bottom: clamp(28px, 4vw, 48px); }
.jb .sektion-kopf h2 { font-size: clamp(30px, 4.6vw, 52px); }
.jb .sektion-kopf p { margin-top: 14px; color: var(--gedaempft); font-size: 17px; }

/* ---------- Navigation ---------- */
.jb .nav { border-bottom: 1px solid var(--linie); background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); position: sticky; top: 0; z-index: 20; }
.jb .nav-innen { display: flex; align-items: center; gap: 20px; min-height: 64px; }
.jb .marke { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 20px; letter-spacing: -.02em; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; white-space: nowrap; }
.jb .marke-quadrat { width: 14px; height: 14px; background: var(--gruen); display: inline-block; }
.jb .nav-links { display: flex; gap: 22px; margin-left: 12px; }
.jb .nav-links a { text-decoration: none; font-size: 15px; color: var(--gedaempft); padding: 6px 0; }
.jb .nav-links a:hover { color: var(--tinte); }
.jb .nav-rechts { margin-left: auto; display: flex; gap: 10px; align-items: center; }
@media (max-width: 860px) { .jb .nav-links { display: none; } }
@media (max-width: 640px) { .jb .nav-text, .jb .nur-gross { display: none !important; } .jb .nav-innen { gap: 10px; } .jb .marke { font-size: 18px; } }

.jb .knopf {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 0 20px; border-radius: 3px;
  border: 1px solid var(--gruen); background: var(--gruen); color: var(--gruen-auf);
  font-weight: 600; font-size: 15px; text-decoration: none;
  transition: background-color .15s, border-color .15s;
}
.jb .knopf:hover { background: var(--gruen-hell); border-color: var(--gruen-hell); }
.jb .knopf.leise { background: transparent; color: var(--tinte); border-color: var(--linie-stark); }
.jb .knopf.leise:hover { background: var(--gruen-weich); border-color: var(--gruen); }
.jb .knopf.klein { min-height: 36px; padding: 0 14px; font-size: 14px; }
.jb .knopf:disabled { opacity: .5; cursor: not-allowed; }

/* ---------- Hero ---------- */
.jb .hero { padding: clamp(40px, 7vw, 88px) 0 clamp(48px, 8vw, 96px); }
.jb .hero-raster { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: clamp(32px, 5vw, 72px); align-items: center; }
@media (max-width: 920px) { .jb .hero-raster { grid-template-columns: 1fr; } }
.jb .hero h1 { font-size: clamp(34px, 5.4vw, 64px); max-width: 16ch; }
.jb .hero-text { margin-top: 22px; font-size: 18px; color: var(--gedaempft); max-width: 46ch; }
.jb .hero-aktionen { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 12px; }
.jb .hero-punkte { margin: 36px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; font-size: 15px; }
.jb .hero-punkte li { display: flex; gap: 12px; align-items: baseline; }
.jb .hero-punkte li::before { content: ""; width: 10px; height: 2px; background: var(--gruen); flex: none; transform: translateY(-4px); }

.jb .blatt {
  background: var(--platte); border: 1px solid var(--linie-stark);
  border-top: 6px solid var(--gruen); padding: clamp(20px, 3vw, 32px);
  box-shadow: 0 1px 0 var(--linie), 0 30px 50px -40px rgba(0,0,0,.45);
}
.jb .blatt-kopf { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 14px; color: var(--gedaempft); }
.jb .blatt-kopf strong { color: var(--tinte); font-weight: 600; }
.jb .blatt-gross { margin: 22px 0 4px; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: clamp(44px, 7vw, 76px); letter-spacing: -.03em; line-height: 1; color: var(--gruen); font-variant-numeric: tabular-nums; }
.jb .blatt-gross.minus { color: var(--rost); }
.jb .blatt-unter { color: var(--gedaempft); font-size: 15px; max-width: 36ch; }
.jb .blatt-zeilen { margin: 24px 0 0; display: grid; gap: 0; }
.jb .blatt-zeilen div { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; border-top: 1px solid var(--linie); font-size: 15px; }
.jb .blatt-zeilen dt { color: var(--gedaempft); }
.jb .blatt-zeilen dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
.jb .blatt-fuss { margin-top: 14px; font-size: 13px; color: var(--gedaempft); }

/* ---------- Beispielwerte-Band ---------- */
.jb .band-hinweis { background: var(--rost-weich); border-bottom: 1px solid var(--linie); font-size: 14px; }
.jb .band-hinweis .huelle { padding: 9px 0; }

/* ---------- Projekte ---------- */
.jb .projekte { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
@media (max-width: 860px) { .jb .projekte { grid-template-columns: 1fr; } }
.jb .projekt { background: var(--platte); border: 1px solid var(--linie-stark); padding: clamp(20px, 3vw, 32px); display: flex; flex-direction: column; gap: 18px; }
.jb .projekt.aktiv { outline: 2px solid var(--gruen); outline-offset: -2px; }
.jb .projekt h3 { font-size: clamp(28px, 3.6vw, 40px); }
.jb .projekt-adresse { color: var(--gedaempft); font-size: 15px; margin-top: 4px; }
.jb .marke-tag { display: inline-block; border: 1px solid var(--gruen); color: var(--gruen); padding: 2px 10px; font-size: 13px; font-weight: 600; border-radius: 2px; }
.jb .projekt-zeile { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.jb .projekt ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; font-size: 15px; }
.jb .projekt ul li { padding-left: 16px; position: relative; }
.jb .projekt ul li::before { content: ""; position: absolute; left: 0; top: .72em; width: 8px; height: 2px; background: var(--gruen); }
.jb .kfw-box { background: var(--papier); border: 1px solid var(--linie); padding: 14px 16px; font-size: 14px; display: grid; gap: 4px; }
.jb .kfw-box strong { font-size: 15px; }
.jb .einheiten { width: 100%; border-collapse: collapse; font-size: 14.5px; font-variant-numeric: tabular-nums; }
.jb .einheiten th { text-align: left; font-weight: 500; color: var(--gedaempft); padding: 6px 0; border-bottom: 1px solid var(--linie-stark); }
.jb .einheiten td { padding: 8px 0; border-bottom: 1px solid var(--linie); }
.jb .einheiten th:last-child, .jb .einheiten td:last-child { text-align: right; }
.jb .projekt .knopf { margin-top: auto; align-self: flex-start; }

/* ---------- Rechner ---------- */
.jb .rechner { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: clamp(20px, 3vw, 40px); align-items: start; }
@media (max-width: 960px) { .jb .rechner { grid-template-columns: 1fr; } }
.jb .eingaben { display: grid; gap: 20px; }
.jb .kasten { background: var(--platte); border: 1px solid var(--linie-stark); padding: clamp(18px, 2.6vw, 26px); display: grid; gap: 16px; }
.jb .kasten > h3 { font-size: 20px; letter-spacing: -.01em; }
.jb .feld { display: grid; gap: 6px; }
.jb .feld-label { font-size: 14px; font-weight: 500; }
.jb .feld-hinweis { font-size: 13px; color: var(--gedaempft); }
.jb .eingabe-zeile { display: flex; align-items: center; border: 1px solid var(--linie-stark); background: var(--papier); border-radius: 3px; min-height: 46px; }
.jb .eingabe-zeile:focus-within { border-color: var(--gruen); box-shadow: 0 0 0 1px var(--gruen); }
.jb .eingabe-zeile input, .jb select.auswahl {
  font: inherit; color: inherit; background: transparent; border: 0; outline: 0; width: 100%; min-height: 44px; padding: 0 12px;
  font-variant-numeric: tabular-nums;
}
.jb .eingabe-zeile .einheit { padding-right: 12px; color: var(--gedaempft); font-size: 14px; white-space: nowrap; }
.jb select.auswahl { border: 1px solid var(--linie-stark); background: var(--papier); border-radius: 3px; }
.jb select.auswahl option { color: #1D211F; background: #F6F5F1; }
.jb .regler-kopf { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.jb .regler-wert { font-weight: 600; font-variant-numeric: tabular-nums; }
.jb input[type=range] { width: 100%; accent-color: var(--gruen); height: 28px; margin: 0; }
.jb .zwei { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 520px) { .jb .zwei { grid-template-columns: 1fr; } }
.jb .segment { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; border: 1px solid var(--linie-stark); border-radius: 3px; overflow: hidden; }
.jb .segment button { min-height: 44px; border: 0; background: var(--papier); padding: 0 10px; font-size: 14.5px; border-right: 1px solid var(--linie); }
.jb .segment button:last-child { border-right: 0; }
.jb .segment button[aria-pressed=true] { background: var(--gruen); color: var(--gruen-auf); font-weight: 600; }
.jb .fest { display: grid; gap: 4px; padding: 12px 14px; border: 1px dashed var(--linie-stark); font-size: 14px; background: var(--papier); }
.jb .fest strong { font-size: 15px; }

.jb .ergebnis { display: grid; gap: 20px; position: sticky; top: 84px; }
@media (max-width: 960px) { .jb .ergebnis { position: static; } }
.jb .kennzahlen { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 520px) { .jb .kennzahlen { grid-template-columns: 1fr; } }
.jb .kz { background: var(--platte); border: 1px solid var(--linie-stark); padding: 16px 18px; display: grid; gap: 4px; align-content: start; }
.jb .kz-label { font-size: 14px; color: var(--gedaempft); }
.jb .kz-wert { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: clamp(26px, 3.2vw, 34px); letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.jb .kz-sub { font-size: 13px; color: var(--gedaempft); }
.jb .kz.hervor { grid-column: 1 / -1; background: var(--gruen); border-color: var(--gruen); color: var(--gruen-auf); }
.jb .kz.hervor .kz-label, .jb .kz.hervor .kz-sub { color: color-mix(in srgb, var(--gruen-auf) 78%, transparent); }
.jb .kz.hervor .kz-wert { font-size: clamp(34px, 5vw, 52px); }
.jb .minus { color: var(--rost); }
.jb .kz.hervor .minus { color: #F4C9B3; }

.jb .diagramm { background: var(--platte); border: 1px solid var(--linie-stark); padding: 18px 18px 12px; }
.jb .diagramm h3 { font-size: 18px; letter-spacing: -.01em; }
.jb .diagramm p { font-size: 13.5px; color: var(--gedaempft); margin: 4px 0 12px; }
.jb .diagramm svg { width: 100%; height: auto; display: block; }
.jb .diagramm text { font-family: 'IBM Plex Sans', sans-serif; font-size: 10px; fill: var(--gedaempft); }
.jb .legende { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; color: var(--gedaempft); margin-top: 8px; }
.jb .legende i { display: inline-block; width: 10px; height: 10px; margin-right: 6px; }

.jb details.auf { background: var(--platte); border: 1px solid var(--linie-stark); }
.jb details.auf summary { cursor: pointer; padding: 14px 18px; font-weight: 600; list-style: none; display: flex; justify-content: space-between; gap: 12px; min-height: 48px; align-items: center; }
.jb details.auf summary::-webkit-details-marker { display: none; }
.jb details.auf summary::after { content: "+"; font-size: 22px; font-weight: 400; line-height: 1; }
.jb details.auf[open] summary::after { content: "–"; }
.jb details.auf .auf-inhalt { padding: 0 18px 18px; font-size: 15px; color: var(--gedaempft); display: grid; gap: 10px; }
.jb .tabelle-rahmen { overflow-x: auto; }
.jb table.jahre { width: 100%; border-collapse: collapse; font-size: 13.5px; font-variant-numeric: tabular-nums; min-width: 560px; color: var(--tinte); }
.jb table.jahre th { text-align: right; font-weight: 500; color: var(--gedaempft); padding: 6px 8px; border-bottom: 1px solid var(--linie-stark); }
.jb table.jahre td { text-align: right; padding: 7px 8px; border-bottom: 1px solid var(--linie); }
.jb table.jahre th:first-child, .jb table.jahre td:first-child { text-align: left; }
.jb dl.liste { margin: 0; display: grid; }
.jb dl.liste div { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; border-top: 1px solid var(--linie); font-size: 14.5px; }
.jb dl.liste dt { color: var(--gedaempft); }
.jb dl.liste dd { margin: 0; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; color: var(--tinte); }
.jb .hinweis-box { padding: 12px 14px; background: var(--rost-weich); border-left: 3px solid var(--rost); font-size: 14px; }
.jb .aktion-leiste { display: flex; flex-wrap: wrap; gap: 10px; }

/* ---------- Ablauf ---------- */
.jb .schritte { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; counter-reset: s; border: 1px solid var(--linie-stark); background: var(--platte); }
@media (max-width: 860px) { .jb .schritte { grid-template-columns: 1fr; } }
.jb .schritt { padding: clamp(20px, 3vw, 32px); border-right: 1px solid var(--linie); display: grid; gap: 10px; align-content: start; counter-increment: s; }
.jb .schritt:last-child { border-right: 0; }
@media (max-width: 860px) { .jb .schritt { border-right: 0; border-bottom: 1px solid var(--linie); } .jb .schritt:last-child { border-bottom: 0; } }
.jb .schritt::before { content: counter(s); font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 44px; line-height: 1; color: var(--gruen); }
.jb .schritt h3 { font-size: 22px; }
.jb .schritt p { color: var(--gedaempft); font-size: 15.5px; }

/* ---------- Hinweise / FAQ ---------- */
.jb .hinweise { display: grid; gap: 10px; max-width: 74ch; font-size: 15px; color: var(--gedaempft); }
.jb .faq { display: grid; gap: 10px; max-width: 80ch; }
.jb .faq details { background: var(--platte); border: 1px solid var(--linie-stark); }
.jb .faq summary { cursor: pointer; padding: 16px 18px; font-weight: 600; list-style: none; display: flex; justify-content: space-between; gap: 16px; align-items: center; min-height: 52px; }
.jb .faq summary::-webkit-details-marker { display: none; }
.jb .faq summary::after { content: "+"; font-size: 22px; font-weight: 400; flex: none; }
.jb .faq details[open] summary::after { content: "–"; }
.jb .faq details p { padding: 0 18px 18px; color: var(--gedaempft); font-size: 15.5px; max-width: 68ch; }

/* ---------- Anfrage ---------- */
.jb .anfrage { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: clamp(24px, 4vw, 64px); align-items: start; }
@media (max-width: 920px) { .jb .anfrage { grid-template-columns: 1fr; } }
.jb .anfrage-text h2 { font-size: clamp(30px, 4.6vw, 52px); }
.jb .anfrage-text p { margin-top: 14px; color: var(--gedaempft); font-size: 17px; max-width: 42ch; }
.jb .anfrage-text .kontakt { margin-top: 24px; font-size: 15px; }
.jb form.formular { display: grid; gap: 16px; background: var(--platte); border: 1px solid var(--linie-stark); border-top: 6px solid var(--gruen); padding: clamp(18px, 3vw, 32px); }
.jb .formular input[type=text], .jb .formular input[type=email], .jb .formular input[type=tel], .jb .formular input[type=password], .jb .formular textarea {
  font: inherit; color: inherit; background: var(--papier); border: 1px solid var(--linie-stark); border-radius: 3px; padding: 0 12px; min-height: 46px; width: 100%;
}
.jb .formular textarea { padding: 10px 12px; min-height: 110px; resize: vertical; }
.jb .formular input:focus, .jb .formular textarea:focus { outline: 0; border-color: var(--gruen); box-shadow: 0 0 0 1px var(--gruen); }
.jb .haken { display: grid; grid-template-columns: 22px 1fr; gap: 10px; align-items: start; font-size: 14.5px; }
.jb .haken input { width: 20px; height: 20px; margin: 2px 0 0; accent-color: var(--gruen); }
.jb .honig { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.jb .meldung { padding: 12px 14px; font-size: 15px; border-left: 3px solid var(--gruen); background: var(--gruen-weich); }
.jb .meldung.fehler { border-left-color: var(--rost); background: var(--rost-weich); }

/* ---------- Footer / Anmeldung ---------- */
.jb .fuss { border-top: 1px solid var(--linie-stark); padding: 36px 0 56px; font-size: 14.5px; color: var(--gedaempft); }
.jb .fuss-innen { display: flex; flex-wrap: wrap; gap: 14px 32px; justify-content: space-between; align-items: baseline; }
.jb .fuss-links { display: flex; gap: 22px; flex-wrap: wrap; }
.jb .rechtstext { padding: 40px 0; border-top: 1px solid var(--linie); }
.jb .rechtstext h2 { font-size: 28px; margin-bottom: 12px; }
.jb .rechtstext p { max-width: 70ch; color: var(--gedaempft); }
.jb .dialog-hinter { position: fixed; inset: 0; background: rgba(10,14,12,.55); z-index: 50; display: grid; place-items: center; padding: 16px; }
.jb .dialog { background: var(--platte); border: 1px solid var(--linie-stark); border-top: 6px solid var(--gruen); width: min(420px, 100%); padding: 26px; display: grid; gap: 16px; }
.jb .dialog h2 { font-size: 26px; }
.jb .gespeichert-liste { display: grid; gap: 0; }
.jb .gespeichert-liste div { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--linie); font-size: 14.5px; }
.jb .gespeichert-liste span.name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.jb .gespeichert-liste .knoepfe { display: flex; gap: 6px; flex: none; }

@media (prefers-reduced-motion: reduce) { .jb * { transition: none !important; animation: none !important; } }
`;
