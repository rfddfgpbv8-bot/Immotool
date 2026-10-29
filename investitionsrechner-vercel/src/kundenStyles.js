/* Gestaltung der Kundenseite: Violett, Khaki und Gelb der Jacobus-Website */

export const KUNDEN_CSS = `
.jb {
  --bg: #FFFFFF;
  --papier: #F4F2EE;
  --platte: #FFFFFF;
  --tinte: #1D152A;
  --gedaempft: #4A4257;
  --linie: #E3DED6;
  --linie-stark: #CFC8BC;
  --gruen: #1D152A;          /* Hauptfarbe (Violett der Website) */
  --gruen-hell: #3A2D52;
  --gruen-auf: #FFFFFF;
  --gruen-weich: rgba(29,21,42,.06);
  --gelb: #F8FE76;           /* Gelb der Website, immer mit dunkler Schrift */
  --gelb-hell: #FCFFB5;
  --akzent: #867050;         /* Khaki der Website */
  --akzent-dunkel: #6B5A3F;
  --pos: #3F6B57;
  --balken-zahlen: #867050;   /* Sie zahlen dazu: Khaki */
  --balken-uebrig: #4A3B6B;   /* Es bleibt übrig: Violett */
  --rost: #9B4B2A;
  --rost-weich: rgba(155,75,42,.10);
  --fokus: #1D152A;
  --fuss-bg: #1D152A;
  --korn-deckkraft: 0;
  color-scheme: light;
}
.jb[data-theme="dunkel"] {
  --bg: #140F1D;
  --papier: #1C1628;
  --platte: #1D152A;
  --tinte: #F4F2EE;
  --gedaempft: #BAC2C5;
  --linie: #3A3049;
  --linie-stark: #4D4260;
  --gruen: #F8FE76;
  --gruen-hell: #FCFFB5;
  --gruen-auf: #1D152A;
  --gruen-weich: rgba(248,254,118,.10);
  --akzent: #B8A27C;
  --akzent-dunkel: #B8A27C;
  --pos: #8FB9A2;
  --balken-zahlen: #B8A27C;
  --balken-uebrig: #E4E88A;
  --rost: #E0956C;
  --rost-weich: rgba(224,149,108,.14);
  --fokus: #F8FE76;
  --fuss-bg: #0F0B16;
  --korn-deckkraft: 0;
  color-scheme: dark;
}

.jb, .jb * { box-sizing: border-box; }
.jb {
  font-family: 'Barlow', system-ui, sans-serif;
  font-size: 17px;
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
  font-family: 'Barlow Semi Condensed', 'Barlow', sans-serif;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.05;
  margin: 0;
}
.jb p { margin: 0; }
.jb a { color: inherit; }
.jb :focus-visible { outline: 2px solid var(--fokus); outline-offset: 3px; border-radius: 3px; }
.jb button { font: inherit; color: inherit; cursor: pointer; }

.jb .huelle { width: min(1180px, 100% - 32px); margin-inline: auto; }
.jb .sektion { padding: clamp(56px, 9vw, 112px) 0; border-top: 1px solid var(--linie); }
.jb .sektion:nth-of-type(even) { background: var(--papier); }
.jb .sektion-kopf { max-width: 60ch; margin-bottom: clamp(28px, 4vw, 48px); }
.jb .sektion-kopf h2 { font-size: clamp(30px, 4.6vw, 52px); }
.jb .sektion-kopf p { margin-top: 14px; color: var(--gedaempft); font-size: 17px; }

/* ---------- Navigation ---------- */
.jb .nav { border-bottom: 1px solid var(--linie); background: var(--bg); position: sticky; top: 0; z-index: 20; }
.jb .nav-innen { display: flex; align-items: center; gap: 20px; min-height: 64px; }
.jb .marke { text-decoration: none; display: inline-flex; align-items: center; min-height: 56px; }
.jb .marke img { height: 42px; width: auto; display: block; }
.jb .logo-dunkel { display: none !important; }
.jb[data-theme="dunkel"] .logo-hell { display: none !important; }
.jb[data-theme="dunkel"] .logo-dunkel { display: block !important; }
.jb .nav-links { display: flex; gap: 22px; margin-left: 12px; }
.jb .nav-links a { text-decoration: none; font-size: 15px; color: var(--gedaempft); padding: 6px 0; }
.jb .nav-links a:hover { color: var(--tinte); }
.jb .nav-rechts { margin-left: auto; display: flex; gap: 10px; align-items: center; }
@media (max-width: 860px) { .jb .nav-links { display: none; } }
@media (max-width: 640px) { .jb .nav-text, .jb .nur-gross { display: none !important; } .jb .nav-innen { gap: 10px; } .jb .marke img { height: 34px; } }

.jb .knopf {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 0 24px; border-radius: 999px;
  border: 1px solid var(--gruen); background: var(--gruen); color: var(--gruen-auf);
  font-family: 'Barlow Semi Condensed', sans-serif; font-weight: 600; font-size: 17px; letter-spacing: .02em; text-decoration: none;
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
.jb .eyebrow { margin: 0 0 14px; font-size: 13px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--akzent-dunkel); }
.jb .hero h1 { font-size: clamp(38px, 5.2vw, 68px); line-height: 1.02; max-width: 14ch; }
.jb .hero h1 span { display: block; }
.jb .hero h1 .leicht { font-weight: 300; color: var(--akzent); }
.jb .hero-text { margin-top: 22px; font-size: 18px; color: var(--gedaempft); max-width: 46ch; }
.jb .hero-aktionen { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 12px; }
.jb .hero-punkte { margin: 36px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; font-size: 15px; }
.jb .hero-punkte li { display: flex; gap: 12px; align-items: baseline; }
.jb .hero-punkte li::before { content: ""; width: 10px; height: 2px; background: var(--akzent); flex: none; transform: translateY(-4px); }

.jb .blatt {
  background: var(--platte); border: 1px solid var(--linie); border-radius: 18px;
  padding: clamp(22px, 3vw, 34px);
  box-shadow: 0 24px 50px -36px rgba(29,21,42,.35);
}
.jb .blatt-kopf { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 14px; color: var(--gedaempft); }
.jb .blatt-kopf strong { color: var(--tinte); font-weight: 600; }
.jb .blatt-gross { margin: 22px 0 4px; font-family: 'Barlow Semi Condensed', sans-serif; font-weight: 700; font-size: clamp(44px, 7vw, 76px); letter-spacing: -.03em; line-height: 1; color: var(--tinte); font-variant-numeric: tabular-nums; }
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
.jb .projekt { background: var(--platte); border: 1px solid var(--linie); border-radius: 18px; padding: clamp(22px, 3vw, 32px); display: flex; flex-direction: column; gap: 18px; }
.jb .projekt.aktiv { outline: 0; border-color: var(--akzent); box-shadow: 0 0 0 1px var(--akzent); }
.jb .projekt h3 { font-size: clamp(28px, 3.6vw, 40px); }
.jb .projekt-adresse { color: var(--gedaempft); font-size: 15px; margin-top: 4px; }
.jb .marke-tag { display: inline-block; border: 1px solid var(--akzent); color: var(--akzent-dunkel); padding: 2px 12px; font-size: 14px; font-weight: 600; border-radius: 999px; }
.jb .projekt-zeile { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.jb .projekt ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; font-size: 15px; }
.jb .projekt ul li { padding-left: 16px; position: relative; }
.jb .projekt ul li::before { content: ""; position: absolute; left: 0; top: .72em; width: 8px; height: 2px; background: var(--akzent); }
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
.jb .kasten { background: var(--platte); border: 1px solid var(--linie); border-radius: 18px; padding: clamp(18px, 2.6vw, 26px); display: grid; gap: 16px; }
.jb .kasten > h3 { font-size: 20px; letter-spacing: -.01em; }
.jb .feld { display: grid; gap: 6px; }
.jb .feld-label { font-size: 14px; font-weight: 500; }
.jb .feld-hinweis { font-size: 13px; color: var(--gedaempft); }
.jb .eingabe-zeile { display: flex; align-items: center; border: 1px solid var(--linie-stark); background: var(--papier); border-radius: 12px; min-height: 46px; }
.jb .eingabe-zeile:focus-within { border-color: var(--gruen); box-shadow: 0 0 0 1px var(--gruen); }
.jb .eingabe-zeile input, .jb select.auswahl {
  font: inherit; color: inherit; background: transparent; border: 0; outline: 0; width: 100%; min-height: 44px; padding: 0 12px;
  font-variant-numeric: tabular-nums;
}
.jb .eingabe-zeile .einheit { padding-right: 12px; color: var(--gedaempft); font-size: 14px; white-space: nowrap; }
.jb select.auswahl { border: 1px solid var(--linie-stark); background: var(--papier); border-radius: 12px; }
.jb select.auswahl option { color: #1D211F; background: #F6F5F1; }
.jb .regler-kopf { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.jb .regler-wert { font-weight: 600; font-variant-numeric: tabular-nums; }
.jb input[type=range] { width: 100%; accent-color: var(--gruen); height: 28px; margin: 0; }
.jb .zwei { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 520px) { .jb .zwei { grid-template-columns: 1fr; } }
.jb .segment { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; border: 1px solid var(--linie-stark); border-radius: 12px; overflow: hidden; }
.jb .segment button { min-height: 44px; border: 0; background: var(--papier); padding: 0 10px; font-size: 14.5px; border-right: 1px solid var(--linie); }
.jb .segment button:last-child { border-right: 0; }
.jb .segment button[aria-pressed=true] { background: var(--gruen); color: var(--gruen-auf); font-weight: 600; }
.jb .fest { display: grid; gap: 4px; padding: 12px 14px; border: 1px dashed var(--linie-stark); font-size: 14px; background: var(--papier); }
.jb .fest strong { font-size: 15px; }

.jb .ergebnis { display: grid; gap: 20px; position: sticky; top: 84px; }
@media (max-width: 960px) { .jb .ergebnis { position: static; } }
.jb .kennzahlen { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 520px) { .jb .kennzahlen { grid-template-columns: 1fr; } }
.jb .kz { background: var(--platte); border: 1px solid var(--linie); border-radius: 18px; padding: 18px 20px; display: grid; gap: 4px; align-content: start; }
.jb .kz-label { font-size: 14px; color: var(--gedaempft); }
.jb .kz-wert { font-family: 'Barlow Semi Condensed', sans-serif; font-weight: 700; font-size: clamp(26px, 3.2vw, 34px); letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.jb .kz-sub { font-size: 13px; color: var(--gedaempft); }
.jb .kz.hervor { grid-column: 1 / -1; background: var(--gruen); border-color: var(--gruen); color: var(--gruen-auf); }
.jb .kz.hervor .kz-label, .jb .kz.hervor .kz-sub { color: color-mix(in srgb, var(--gruen-auf) 78%, transparent); }
.jb .kz.hervor .kz-wert { font-size: clamp(34px, 5vw, 52px); }
.jb .minus { color: var(--rost); }
.jb .kz.hervor .minus { color: #F4C9B3; }
.jb[data-theme="dunkel"] .kz.hervor { background: var(--papier); border-color: var(--linie-stark); color: var(--tinte); }
.jb[data-theme="dunkel"] .kz.hervor .kz-label, .jb[data-theme="dunkel"] .kz.hervor .kz-sub { color: var(--gedaempft); }
.jb[data-theme="dunkel"] .kz.hervor .minus { color: var(--rost); }

.jb .diagramm { background: var(--platte); border: 1px solid var(--linie); border-radius: 18px; padding: 18px 18px 12px; }
.jb .diagramm h3 { font-size: 18px; letter-spacing: -.01em; }
.jb .diagramm p { font-size: 13.5px; color: var(--gedaempft); margin: 4px 0 12px; }
.jb .diagramm svg { width: 100%; height: auto; display: block; }
.jb .diagramm text { font-family: 'Barlow', sans-serif; font-size: 10px; fill: var(--gedaempft); }
.jb .diagramm .achse { font-size: 11px; font-variant-numeric: tabular-nums; }
.jb .diagramm .achse-titel { font-size: 11px; fill: var(--akzent-dunkel); font-weight: 600; }
.jb .diagramm .wertlabel { font-size: 11px; font-weight: 600; fill: var(--tinte); font-variant-numeric: tabular-nums; }
@media (max-width: 520px) { .jb .diagramm .wertlabel { display: none; } .jb .diagramm .achse { font-size: 13px; } .jb .diagramm .achse-titel { font-size: 12.5px; } }
.jb .legende { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; color: var(--gedaempft); margin-top: 8px; }
.jb .legende i { display: inline-block; width: 10px; height: 10px; margin-right: 6px; }

.jb details.auf { background: var(--platte); border: 1px solid var(--linie); border-radius: 18px; }
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
.jb .schritte { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; counter-reset: s; border: 1px solid var(--linie); border-radius: 18px; overflow: hidden; background: var(--platte); }
@media (max-width: 860px) { .jb .schritte { grid-template-columns: 1fr; } }
.jb .schritt { padding: clamp(20px, 3vw, 32px); border-right: 1px solid var(--linie); display: grid; gap: 10px; align-content: start; counter-increment: s; }
.jb .schritt:last-child { border-right: 0; }
@media (max-width: 860px) { .jb .schritt { border-right: 0; border-bottom: 1px solid var(--linie); } .jb .schritt:last-child { border-bottom: 0; } }
.jb .schritt::before { content: counter(s); font-family: 'Barlow Semi Condensed', sans-serif; font-weight: 700; font-size: 48px; font-weight: 300; line-height: 1; color: var(--akzent); }
.jb .schritt h3 { font-size: 22px; }
.jb .schritt p { color: var(--gedaempft); font-size: 15.5px; }

/* ---------- Hinweise / FAQ ---------- */
.jb .hinweise { display: grid; gap: 10px; max-width: 74ch; font-size: 15px; color: var(--gedaempft); }
.jb .faq { display: grid; gap: 10px; max-width: 80ch; }
.jb .faq details { background: var(--platte); border: 1px solid var(--linie); border-radius: 18px; }
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
.jb form.formular { display: grid; gap: 16px; background: var(--platte); border: 1px solid var(--linie); border-radius: 18px; padding: clamp(20px, 3vw, 34px); }
.jb .formular input[type=text], .jb .formular input[type=email], .jb .formular input[type=tel], .jb .formular input[type=password], .jb .formular textarea {
  font: inherit; color: inherit; background: var(--papier); border: 1px solid var(--linie-stark); border-radius: 12px; padding: 0 12px; min-height: 46px; width: 100%;
}
.jb .formular textarea { padding: 10px 12px; min-height: 110px; resize: vertical; }
.jb .formular input:focus, .jb .formular textarea:focus { outline: 0; border-color: var(--gruen); box-shadow: 0 0 0 1px var(--gruen); }
.jb .haken { display: grid; grid-template-columns: 22px 1fr; gap: 10px; align-items: start; font-size: 14.5px; }
.jb .haken input { width: 20px; height: 20px; margin: 2px 0 0; accent-color: var(--gruen); }
.jb .honig { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.jb .meldung { padding: 12px 14px; font-size: 15px; border-left: 3px solid var(--gruen); background: var(--gruen-weich); }
.jb .meldung.fehler { border-left-color: var(--rost); background: var(--rost-weich); }

/* ---------- Footer / Anmeldung ---------- */
.jb .fuss { background: var(--fuss-bg); border-top: 1px solid #3A3049; padding: 44px 0 56px; font-size: 15px; color: #BAC2C5; }
.jb .fuss a { color: #BAC2C5; }
.jb .fuss-logo { display: inline-flex; align-items: center; gap: 20px; }
.jb .fuss-logo img { height: 40px; width: auto; display: block; }
.jb .fuss-innen { display: flex; flex-wrap: wrap; gap: 14px 32px; justify-content: space-between; align-items: baseline; }
.jb .fuss-links { display: flex; gap: 22px; flex-wrap: wrap; }
.jb .rechtstext { padding: 40px 0; border-top: 1px solid var(--linie); }
.jb .rechtstext h2 { font-size: 28px; margin-bottom: 12px; }
.jb .rechtstext p { max-width: 70ch; color: var(--gedaempft); }
.jb .dialog-hinter { position: fixed; inset: 0; background: rgba(10,14,12,.55); z-index: 50; display: grid; place-items: center; padding: 16px; }
.jb .dialog { background: var(--platte); border: 1px solid var(--linie); border-radius: 18px; width: min(420px, 100%); padding: 26px; display: grid; gap: 16px; }
.jb .dialog h2 { font-size: 26px; }
.jb .gespeichert-liste { display: grid; gap: 0; }
.jb .gespeichert-liste div { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid var(--linie); font-size: 14.5px; }
.jb .gespeichert-liste span.name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.jb .gespeichert-liste .knoepfe { display: flex; gap: 6px; flex: none; }

@media (prefers-reduced-motion: reduce) { .jb * { transition: none !important; animation: none !important; } }

/* ---------- Feinschliff: ruhiger, hochwertiger ---------- */
@keyframes rein { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

/* Navigation: hell, klar */
.jb .nav { background: color-mix(in srgb, var(--bg) 92%, transparent); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
.jb .nav-links a { font-weight: 500; letter-spacing: .01em; font-size: 15.5px; }

/* Hero: hell und freundlich, die Rechenkarte setzt den dunklen Akzent */
.jb .hero {
  background:
    radial-gradient(50% 70% at 94% 0%, rgba(248,254,118,.30), transparent 62%),
    radial-gradient(45% 60% at 0% 100%, rgba(134,112,80,.10), transparent 68%),
    linear-gradient(180deg, #FBFAF7, #FFFFFF);
  padding: clamp(56px, 8vw, 108px) 0 clamp(64px, 9vw, 120px);
  border-bottom: 1px solid var(--linie);
}
.jb[data-theme="dunkel"] .hero {
  background:
    radial-gradient(60% 80% at 90% 0%, rgba(134,112,80,.30), transparent 62%),
    radial-gradient(55% 70% at 0% 100%, rgba(78,54,116,.45), transparent 66%),
    #1D152A;
  border-bottom-color: rgba(255,255,255,.08);
}
.jb .eyebrow { display: inline-flex; align-items: center; gap: 14px; background: none; padding: 0; border-radius: 0; margin: 0 0 26px; font-size: 12.5px; letter-spacing: .22em; color: var(--akzent-dunkel); }
.jb .eyebrow::before { content: ""; width: 34px; height: 2px; background: var(--akzent); }
.jb[data-theme="dunkel"] .eyebrow::before { background: var(--gelb); }
.jb .hero h1 { font-weight: 600; font-size: clamp(40px, 5.4vw, 78px); line-height: 1; letter-spacing: -.012em; max-width: 15ch; }
.jb .hero h1 .leicht,
.jb[data-theme="dunkel"] .hero h1 .leicht { display: block; background: none; padding: 0; margin: 0; font-weight: 300; color: var(--akzent); }
.jb .hero-text { font-size: 19px; line-height: 1.55; margin-top: 26px; }
.jb .hero-aktionen { margin-top: 36px; }
.jb .hero-punkte { margin-top: 40px; }
.jb .hero-punkte li::before { background: var(--akzent); }
@media (prefers-reduced-motion: no-preference) {
  .jb .hero-raster > * { animation: rein .9s cubic-bezier(.2,.7,.2,1) both; }
  .jb .hero-raster > *:nth-child(2) { animation-delay: .14s; }
}

/* Rechenkarte im Hero: dunkel, damit das Ergebnis im Mittelpunkt steht */
.jb .blatt {
  --tinte: #F4F2EE; --gedaempft: #C7C0D2; --linie: rgba(255,255,255,.14);
  color: #F4F2EE;
  background: radial-gradient(120% 140% at 100% 0%, rgba(134,112,80,.42), transparent 56%), #1D152A;
  border: 1px solid #1D152A; border-radius: 20px;
  box-shadow: 0 40px 80px -44px rgba(29,21,42,.6);
}
.jb[data-theme="dunkel"] .blatt { border-color: rgba(255,255,255,.18); }
.jb .blatt-kopf strong { color: #fff; }
.jb .blatt-kopf span:last-child { background: none; border: 1px solid rgba(248,254,118,.55); color: var(--gelb); padding: 2px 12px; border-radius: 999px; font-weight: 600; font-size: 11.5px; letter-spacing: .1em; text-transform: uppercase; align-self: center; }
.jb .blatt-gross, .jb .blatt-gross.minus { color: var(--gelb); font-weight: 600; }
.jb .blatt-zeilen dd { color: #fff; }

/* Vertrauensleiste */
.jb .vertrauen { background: var(--bg); border-bottom: 1px solid var(--linie); }
.jb .vertrauen-raster { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(20px, 3vw, 44px); padding: clamp(28px, 4vw, 44px) 0; }
@media (max-width: 860px) { .jb .vertrauen-raster { grid-template-columns: 1fr; gap: 22px; } }
.jb .vertrauen-punkt { display: grid; grid-template-columns: 44px 1fr; gap: 16px; align-items: start; }
.jb .vertrauen-icon { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--gelb); color: #1D152A; }
.jb .vertrauen-icon svg { width: 22px; height: 22px; }
.jb .vertrauen-punkt strong { display: block; font-family: 'Barlow Semi Condensed', sans-serif; font-size: 19px; font-weight: 600; margin-bottom: 4px; }
.jb .vertrauen-punkt span { color: var(--gedaempft); font-size: 15px; line-height: 1.5; }

/* Beispielwerte-Band: schmal und ruhig */
.jb .band-hinweis { background: var(--papier); color: var(--gedaempft); border-bottom: 1px solid var(--linie); font-size: 13px; letter-spacing: .01em; }
.jb .band-hinweis .huelle { display: flex; align-items: center; gap: 12px; }
.jb .band-hinweis .huelle::before { content: ""; flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--gelb); box-shadow: 0 0 0 1px rgba(29,21,42,.25); }

/* Abschnittsköpfe */
.jb .sektion-kopf h2, .jb .anfrage-text h2 { font-weight: 600; letter-spacing: -.01em; }
.jb .sektion-kopf h2::before, .jb .anfrage-text h2::before { content: ""; display: block; width: 36px; height: 2px; background: var(--akzent); margin-bottom: 22px; }
.jb .sektion { padding: clamp(64px, 10vw, 128px) 0; }

/* Karten: kleinerer Radius, hauchdünner Rand, kaum Schatten */
.jb .kasten, .jb .kz, .jb .diagramm, .jb details.auf, .jb .schritte, .jb .faq details, .jb form.formular, .jb .dialog, .jb .projekt { border-radius: 14px; }
.jb:not([data-theme="dunkel"]) .kasten, .jb:not([data-theme="dunkel"]) .kz, .jb:not([data-theme="dunkel"]) .projekt,
.jb:not([data-theme="dunkel"]) form.formular, .jb:not([data-theme="dunkel"]) .diagramm {
  box-shadow: 0 1px 2px rgba(29,21,42,.04), 0 18px 40px -30px rgba(29,21,42,.22);
}
.jb .kasten > h3 { font-weight: 600; font-size: 21px; }

/* Eingabefelder: klar umrandet statt grau gefüllt */
.jb .eingabe-zeile, .jb select.auswahl,
.jb .formular input[type=text], .jb .formular input[type=email], .jb .formular input[type=tel], .jb .formular input[type=password], .jb .formular textarea { background: var(--platte); border-radius: 10px; }
.jb .eingabe-zeile:focus-within, .jb .formular input:focus, .jb .formular textarea:focus { border-color: var(--tinte); box-shadow: 0 0 0 3px color-mix(in srgb, var(--gelb) 70%, transparent); }
.jb .segment { border-radius: 10px; }
.jb .segment button { background: var(--platte); transition: background-color .15s; }
.jb .segment button:hover { background: var(--papier); }
.jb .segment button[aria-pressed=true] { background: var(--gruen); }
.jb .fest { border: 0; border-left: 3px solid var(--akzent); border-radius: 0 8px 8px 0; background: var(--papier); }
.jb .kfw-box { border-radius: 8px; }
.jb .marke-tag { background: none; border-color: var(--akzent); color: var(--akzent-dunkel); letter-spacing: .04em; }

/* Buttons: ruhiger, mit gelbem Ring beim Darüberfahren (wie die Website) */
.jb .knopf { min-height: 48px; padding: 0 28px; letter-spacing: .03em; transition: background-color .15s, border-color .15s, box-shadow .2s, transform .2s; }
.jb .knopf.klein { min-height: 38px; padding: 0 16px; }
.jb .knopf:not(.leise):not(:disabled):hover { box-shadow: 0 0 0 3px var(--gelb); transform: translateY(-1px); }

/* Kennzahlen */
.jb .kz-wert { font-weight: 600; }
.jb .kz.hervor { background: radial-gradient(110% 150% at 100% 0%, rgba(134,112,80,.38), transparent 58%), #1D152A; border-color: #1D152A; color: #F4F2EE; padding: 24px 26px; }
.jb .kz.hervor .kz-label, .jb .kz.hervor .kz-sub { color: rgba(244,242,238,.72); }
.jb .kz.hervor .kz-wert, .jb .kz.hervor .minus { color: var(--gelb); font-size: clamp(40px, 5.4vw, 60px); }
.jb[data-theme="dunkel"] .kz.hervor { background: radial-gradient(110% 150% at 100% 0%, rgba(134,112,80,.30), transparent 58%), var(--papier); border-color: var(--linie-stark); }
.jb[data-theme="dunkel"] .kz.hervor .kz-label, .jb[data-theme="dunkel"] .kz.hervor .kz-sub { color: var(--gedaempft); }
.jb[data-theme="dunkel"] .kz.hervor .minus { color: var(--gelb); }

/* Ablauf */
.jb .schritt::before { font-size: 56px; letter-spacing: -.02em; }
.jb .fuss a:hover { color: var(--gelb); }
.jb[data-theme="dunkel"] .knopf.leise { color: var(--tinte); }
.jb[data-theme="dunkel"] .knopf.leise:hover { background: var(--gruen-weich); border-color: var(--gelb); }

/* Nummerierte Schritte im Rechner */
.jb .eingaben { counter-reset: k; }
.jb .kasten > h3 { counter-increment: k; display: flex; align-items: center; gap: 12px; }
.jb .kasten > h3::before { content: counter(k); flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--gelb); color: #1D152A; font-size: 14px; font-weight: 700; }

/* Zusammenfassung in Klartext */
.jb .zusammenfassung { background: var(--platte); border: 1px solid var(--linie); border-left: 3px solid var(--akzent); border-radius: 0 14px 14px 0; padding: 16px 20px; font-size: 16px; line-height: 1.6; }
.jb .zusammenfassung strong { font-weight: 600; font-variant-numeric: tabular-nums; }

/* Zusagen am Formular */
.jb .zusagen { list-style: none; margin: 26px 0 0; padding: 0; display: grid; gap: 12px; font-size: 15.5px; }
.jb .zusagen li { display: flex; gap: 12px; align-items: center; }
.jb .zusagen li::before { content: ""; flex: none; width: 20px; height: 20px; border-radius: 50%; background: var(--gelb) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path d='M5.5 10.5l3 3 6-7' fill='none' stroke='%231D152A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>") center/20px no-repeat; }

/* Ergebnisleiste, nur auf dem Handy */
.jb .leiste-mobil { display: none; }
@media (max-width: 960px) {
  .jb .leiste-mobil { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 10px 10px 18px; border-radius: 999px; background: #1D152A; color: #F4F2EE; box-shadow: 0 16px 40px -12px rgba(0,0,0,.45); transform: translateY(140%); opacity: 0; transition: transform .3s, opacity .3s; pointer-events: none; }
  .jb .leiste-mobil.sichtbar { transform: none; opacity: 1; pointer-events: auto; }
  .jb .leiste-mobil .l-label { display: block; font-size: 12px; color: #C7C0D2; line-height: 1.2; }
  .jb .leiste-mobil .l-wert { display: block; font-family: 'Barlow Semi Condensed', sans-serif; font-weight: 600; font-size: 22px; color: var(--gelb); line-height: 1.15; font-variant-numeric: tabular-nums; }
  .jb .leiste-mobil .knopf { min-height: 40px; padding: 0 18px; font-size: 15px; background: var(--gelb); border-color: var(--gelb); color: #1D152A; }
  .jb { padding-bottom: 0; }
}
`;
