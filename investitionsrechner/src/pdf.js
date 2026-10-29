import { eur, eur2, pct } from "./rechenkern";

const WINANSI = {
  "\u20AC": 0x80, "\u201A": 0x82, "\u201E": 0x84, "\u2026": 0x85, "\u2018": 0x91,
  "\u2019": 0x92, "\u201C": 0x93, "\u201D": 0x94, "\u2022": 0x95, "\u2013": 0x96,
  "\u2014": 0x97, "\u2212": 0x2D, "\u00A0": 0x20,
};

function pdfKod(t) {
  let o = "";
  for (const ch of String(t)) {
    const c = ch.charCodeAt(0);
    if (c < 256) o += ch;
    else if (WINANSI[ch] !== undefined) o += String.fromCharCode(WINANSI[ch]);
    else o += "?";
  }
  return o;
}
const pdfEsc = (t) => pdfKod(t).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/* Baut den Bericht als PDF-Bytes. Schrift: Helvetica für Text, Courier für Zahlen. */
export function pdfDatei(s, r, profil, grenz) {
  const W = 595.28, H = 841.89, M = 48, RE = W - M;
  const TINTE = "0.07 0.11 0.15";
  const GRAU = "0.42 0.49 0.55";
  const AKZ = "0.059 0.318 0.196";
  const ROT = "0.72 0.31 0.18";
  const LINIE_F = "0.85 0.88 0.91";
  const FLAECHE = "0.955 0.968 0.975";

  const seiten = [];
  let c = "";

  const cw = (txt, size) => pdfKod(String(txt)).length * 0.6 * size; // Courier-Breite
  const T = (x, y, txt, font, size, col) =>
    `${col || TINTE} rg\nBT /${font || "F1"} ${size || 9} Tf 1 0 0 1 ${x.toFixed(2)} ${(H - y).toFixed(2)} Tm (${pdfEsc(txt)}) Tj ET\n`;
  const TR = (xEnde, y, txt, font, size, col) =>
    T(xEnde - cw(txt, size || 8), y, txt, font || "F3", size || 8, col);
  const LN = (x1, y, x2, dicke, col) =>
    `${col || LINIE_F} RG\n${dicke || 0.6} w\n${x1.toFixed(2)} ${(H - y).toFixed(2)} m ${x2.toFixed(2)} ${(H - y).toFixed(2)} l S\n`;
  const BOX = (x, y, w, h, col) =>
    `${col} rg\n${x.toFixed(2)} ${(H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;

  const kopf = () => {
    c += BOX(0, 0, W, 3.5, AKZ);
    c += T(M, 34, "INVESTITIONSRECHNER", "F2", 7.5, GRAU);
    c += TR(RE, 34, s.projektName || "Ohne Titel", "F3", 7.5, GRAU);
    c += LN(M, 40, RE);
  };
  const neueSeite = () => {
    if (c) seiten.push(c);
    c = "";
    kopf();
  };

  /* Umbruch für Fließtext, geschätzte Helvetica-Breite */
  const umbruch = (txt, size, maxBreite) => {
    const worte = String(txt).split(" ");
    const zeilen = [];
    let z = "";
    for (const w of worte) {
      const test = z ? z + " " + w : w;
      if (test.length * size * 0.5 > maxBreite && z) {
        zeilen.push(z);
        z = w;
      } else z = test;
    }
    if (z) zeilen.push(z);
    return zeilen;
  };

  const absatz = (y, txt, size, col) => {
    const zeilen = umbruch(txt, size || 8.5, RE - M);
    zeilen.forEach((z, i) => {
      c += T(M, y + i * (size || 8.5) * 1.5, z, "F1", size || 8.5, col || GRAU);
    });
    return y + zeilen.length * (size || 8.5) * 1.5;
  };

  const abschnitt = (y, titel) => {
    c += T(M, y, titel, "F2", 10.5, TINTE);
    c += LN(M, y + 6, RE, 0.8, "0.78 0.82 0.86");
    return y + 22;
  };

  const paar = (y, x, breite, label, wert, stark) => {
    c += T(x, y, label, stark ? "F2" : "F1", 8.5, stark ? TINTE : GRAU);
    c += TR(x + breite, y, wert, stark ? "F4" : "F3", 8.5, TINTE);
    c += LN(x, y + 4.5, x + breite, 0.4);
    return y + 15;
  };

  const tabelle = (y, spalten, zeilen, fuss) => {
    c += BOX(M, y - 10, RE - M, 16, FLAECHE);
    spalten.forEach((sp) => {
      if (sp.links) c += T(sp.x, y, sp.t, "F4", 7, GRAU);
      else c += TR(sp.x, y, sp.t, "F4", 7, GRAU);
    });
    y += 15;
    zeilen.forEach((zeile) => {
      spalten.forEach((sp, i) => {
        const v = zeile[i];
        const col = v && v.col ? v.col : TINTE;
        const txt = v && v.t !== undefined ? v.t : v;
        if (sp.links) c += T(sp.x, y, txt, "F3", 7.5, col);
        else c += TR(sp.x, y, txt, "F3", 7.5, col);
      });
      c += LN(M, y + 4, RE, 0.35);
      y += 14;
    });
    if (fuss) {
      c += BOX(M, y - 10, RE - M, 15, FLAECHE);
      spalten.forEach((sp, i) => {
        const v = fuss[i];
        if (v === undefined || v === null) return;
        if (sp.links) c += T(sp.x, y, v, "F4", 7.5, TINTE);
        else c += TR(sp.x, y, v, "F4", 7.5, TINTE);
      });
      y += 16;
    }
    return y + 6;
  };

  const spaltenSatz = (titel, ersteBreite, anzahl) => {
    const rest = (RE - M - ersteBreite) / anzahl;
    return titel.map((t, i) =>
      i === 0
        ? { t, x: M, links: true }
        : { t, x: M + ersteBreite + rest * i }
    );
  };

  /* ---- Seite 1: Überblick ---- */
  neueSeite();
  let y = 78;
  c += T(M, y, s.projektName || "Investitionsberechnung", "F2", 21, TINTE);
  y += 20;
  const zeile2 = [s.standort, s.kundeName ? "für " + s.kundeName : "",
    "Stand " + new Date().toLocaleDateString("de-DE")].filter(Boolean).join("   ·   ");
  c += T(M, y, zeile2, "F1", 9, GRAU);
  y += 26;

  const kzBreite = (RE - M - 30) / 4;
  const kzDaten = [
    ["Eigenkapital", eur(r.eigenkapital) + " EUR", TINTE],
    ["Aufwand p. M. nach Steuern", eur(r.aufwandPM) + " EUR", r.aufwandPM > 0 ? ROT : AKZ],
    ["Steuerersparnis kumuliert", eur(r.kumSteuerersparnis) + " EUR", TINTE],
    ["Überschuss " + s.endJahr, eur(r.ueberschuss) + " EUR", AKZ],
  ];
  kzDaten.forEach((k, i) => {
    const x = M + i * (kzBreite + 10);
    c += BOX(x, y, kzBreite, 52, FLAECHE);
    c += T(x + 10, y + 17, k[0], "F1", 6.8, GRAU);
    c += T(x + 10, y + 37, k[1], "F4", 11.5, k[2]);
  });
  y += 76;

  const spalteB = M + (RE - M) / 2 + 12;
  const halb = (RE - M) / 2 - 12;
  let yl = abschnitt(y, "Kosten und Finanzierung");
  const yStart = yl;
  yl = paar(yl, M, halb, "Kaufpreis Wohnung", eur(s.kaufpreis));
  yl = paar(yl, M, halb, "Stellplatz", eur(s.stellplatzPreis));
  yl = paar(yl, M, halb, "Grunderwerbsteuer " + pct(s.grestSatz) + " %", eur(r.grest));
  yl = paar(yl, M, halb, "Notar und Gericht", eur(r.notar));
  yl = paar(yl, M, halb, "Vermittlung und Beratung", eur(r.beratung));
  yl = paar(yl, M, halb, "Gesamtkosten", eur(r.gesamtkosten), true);
  yl = paar(yl, M, halb, "Eigenkapital", eur(r.eigenkapital));
  yl = paar(yl, M, halb, "Darlehensbedarf", eur(r.darlehensbedarf), true);
  s.darlehen.forEach((d) =>
    (yl = paar(yl, M, halb, d.name + " · " + pct(d.zins) + " % / " + pct(d.tilgung) + " %", eur(d.betrag)))
  );

  c += T(spalteB, y, "Steuer und Abschreibung", "F2", 10.5, TINTE);
  c += LN(spalteB, y + 6, RE, 0.8, "0.78 0.82 0.86");
  let yr = yStart;
  yr = paar(yr, spalteB, halb, "Zu versteuerndes Einkommen", eur(s.zvE));
  yr = paar(yr, spalteB, halb, "Veranlagung", s.splitting ? "zusammen" : "einzeln");
  yr = paar(yr, spalteB, halb, "Tarifjahr / Anpassung", s.tarifJahr + " / " + pct(s.tarifAnpassung) + " %");
  yr = paar(yr, spalteB, halb, "Einkommensteuer " + s.startJahr, eur(profil.est));
  yr = paar(yr, spalteB, halb, "Solidaritätszuschlag", eur(profil.soli));
  yr = paar(yr, spalteB, halb, "Kirchensteuer", eur(profil.kirche));
  yr = paar(yr, spalteB, halb, "Steuer gesamt", eur(profil.gesamt), true);
  yr = paar(yr, spalteB, halb, "Grenzsteuersatz", pct(grenz) + " %");
  yr = paar(yr, spalteB, halb, "Gebäudeart", s.gebaeudeart === "denkmal" ? "Denkmal (§ 7h/7i)" : "Neubau");
  if (s.gebaeudeart === "neubau") {
    yr = paar(yr, spalteB, halb,
      s.degressiv ? "Grundlage degressive AfA" : "Grundlage lineare AfA", eur(r.bmgDegressiv), true);
    if (s.sonder7b) yr = paar(yr, spalteB, halb, "Grundlage Sonder-AfA § 7b", eur(r.bmg7b), true);
  } else {
    yr = paar(yr, spalteB, halb, "Grundlage Modernisierung § 7h/7i", eur(r.denkmalModernisierung), true);
    yr = paar(yr, spalteB, halb, "Grundlage Altbau, linear", eur(r.denkmalAltbau), true);
  }

  y = Math.max(yl, yr) + 14;
  y = abschnitt(y, "Annahmen");
  const annahmen = [
    ["Wohnfläche", eur2(s.wohnflaeche) + " m²"],
    ["Kaltmiete ab " + s.vermietungJahr, eur2(s.wohnflaeche * s.mieteProQm + s.stellplatzMiete) + " EUR/Monat"],
    ["Mietsteigerung", pct(s.mietSteigerung) + " % alle " + s.mietIntervall + " Jahre ab " + s.mietSteigerungAb],
    ["Bewirtschaftung", eur(s.verwaltungWEG + s.verwaltungSE + s.sonstigeKosten) + " EUR/Jahr"],
    ["Erhaltungsrücklage", eur2(s.ruecklageProQm) + " EUR/m²/Monat"],
    ["Kostensteigerung", pct(s.kostenSteigerung) + " % p. a."],
    ["Wertsteigerung", pct(s.wertSteigerung) + " % p. a. ab " + s.wertSteigerungAb],
    ["Tilgungszuschuss", eur(s.zuschussBetrag) + " EUR (" + s.zuschussMonat + "/" + s.zuschussJahr + ")"],
  ];
  annahmen.forEach((a, i) => {
    const x = i % 2 === 0 ? M : spalteB;
    if (i % 2 === 0 && i > 0) y += 0;
    const zy = y + Math.floor(i / 2) * 15;
    c += T(x, zy, a[0], "F1", 8.5, GRAU);
    c += TR(x + halb, zy, a[1], "F3", 8.5, TINTE);
    c += LN(x, zy + 4.5, x + halb, 0.4);
  });
  y += Math.ceil(annahmen.length / 2) * 15 + 10;

  /* ---- Seite 2: Liquidität ---- */
  neueSeite();
  y = 78;
  y = abschnitt(y, "Liquidität je Jahr");
  const sp1 = spaltenSatz(
    ["Jahr", "Zinsen", "Tilgung", "Rücklage", "Verwaltung", "Miete", "Ersparnis", "p. a.", "p. M."],
    34, 8
  );
  y = tabelle(
    y, sp1,
    r.zeilen.map((z) => [
      String(z.jahr),
      z.zinsen ? eur(z.zinsen) : "-",
      z.tilgung ? eur(z.tilgung) : "-",
      z.ruecklage ? eur(z.ruecklage) : "-",
      z.verwaltung ? eur(z.verwaltung) : "-",
      z.miete ? eur(z.miete) : "-",
      z.ersparnis ? eur(z.ersparnis) : "-",
      { t: eur(z.aufwandNachSteuern), col: z.aufwandNachSteuern > 0 ? ROT : AKZ },
      { t: eur(z.aufwandNachSteuern / 12), col: z.aufwandNachSteuern > 0 ? ROT : AKZ },
    ]),
    ["Summe",
     eur(r.zeilen.reduce((a, z) => a + z.zinsen, 0)),
     eur(r.zeilen.reduce((a, z) => a + z.tilgung, 0)),
     eur(r.zeilen.reduce((a, z) => a + z.ruecklage, 0)),
     eur(r.zeilen.reduce((a, z) => a + z.verwaltung, 0)),
     eur(r.zeilen.reduce((a, z) => a + z.miete, 0)),
     eur(r.kumSteuerersparnis),
     eur(r.kumAufwandNachSteuern), ""]
  );
  y += 8;
  y = absatz(y,
    "Positive Werte sind Eigenaufwand, negative Werte ein Überschuss. Die Tilgung enthält den Tilgungszuschuss, der nicht aus eigenen Mitteln aufgebracht wird. Die Erhaltungsrücklage mindert die Liquidität, aber nicht das steuerliche Ergebnis.");

  /* ---- Seite 3: Steuer und AfA ---- */
  neueSeite();
  y = 78;
  y = abschnitt(y, "Steuerwirkung");
  const sp2 = spaltenSatz(
    ["Jahr", "zvE", "ESt", "Soli", "KiSt", "AfA", "Erg. V+V", "zvE neu", "St. neu", "Erspar."],
    30, 9
  );
  y = tabelle(y, sp2, r.zeilen.map((z) => [
    String(z.jahr), eur(z.zvE), eur(z.estAlt),
    z.soliAlt ? eur(z.soliAlt) : "-", z.kircheAlt ? eur(z.kircheAlt) : "-",
    z.afa ? eur(z.afa) : "-",
    { t: eur(z.ergebnis), col: z.ergebnis < 0 ? ROT : TINTE },
    eur(z.zvENeu), eur(z.steuerNeu), z.ersparnis ? eur(z.ersparnis) : "-",
  ]));
  y += 14;
  y = abschnitt(y, "Abschreibung und Restschuld");
  const sp3 = spaltenSatz(
    ["Jahr",
     s.gebaeudeart === "denkmal" ? "Altbau linear" : (s.degressiv ? "Degressive AfA" : "Lineare AfA"),
     s.gebaeudeart === "denkmal" ? "Modernisierung 7h/7i" : "Sonder-AfA § 7b",
     "AfA gesamt", "Restschuld"],
    40, 4
  );
  y = tabelle(y, sp3, r.zeilen.map((z) => [
    String(z.jahr),
    z.afaNormal ? eur(z.afaNormal) : "-",
    z.afaSonder ? eur(z.afaSonder) : "-",
    z.afa ? eur(z.afa) : "-",
    z.restschuld ? eur(z.restschuld) : "-",
  ]));

  /* ---- Seite 4: Vermögen ---- */
  neueSeite();
  y = 78;
  y = abschnitt(y, "Vermögensbetrachtung " + s.endJahr);
  y = paar(y, M, RE - M, "Verkehrswert bei " + pct(s.wertSteigerung) + " % p. a.", eur(r.immobilienwert));
  y = paar(y, M, RE - M, "abzüglich Restschuld", "-" + eur(r.restschuldEnde));
  y = paar(y, M, RE - M, "abzüglich Eigenkapital", "-" + eur(r.eigenkapital));
  y = paar(y, M, RE - M, "abzüglich Liquiditätsbedarf vor Steuern", "-" + eur(r.kumAufwandVorSteuern));
  y = paar(y, M, RE - M, "zuzüglich Steuerersparnis", "+" + eur(r.kumSteuerersparnis));
  y = paar(y, M, RE - M, "Überschuss", eur(r.ueberschuss), true);
  y += 10;
  c += BOX(M, y, RE - M, 44, FLAECHE);
  c += T(M + 14, y + 18, "Interne Verzinsung des eingesetzten Kapitals nach Steuern", "F1", 8.5, GRAU);
  c += T(M + 14, y + 34, r.irr === null ? "nicht bestimmbar" : pct(r.irr) + " % p. a.", "F4", 12, AKZ);
  y += 62;

  y = abschnitt(y, "Hinweise");
  y = absatz(y,
    "Die Einkommensteuer folgt dem Tarif des § 32a EStG in der Fassung für " + s.tarifJahr +
    ", bei Zusammenveranlagung nach § 32a Abs. 5 EStG. Der Solidaritätszuschlag wird mit Freigrenze und Milderungszone berücksichtigt, die Kirchensteuer auf die um Kinderfreibeträge geminderte Bemessungsgrundlage. Bei einer Tarifanpassung von 0 % entsprechen die Beträge des Tarifjahres denen des amtlichen BMF-Steuerrechners.");
  y += 6;
  y = absatz(y,
    "Ein Verkauf innerhalb von zehn Jahren nach Anschaffung löst nach § 23 EStG einen steuerpflichtigen Veräußerungsgewinn aus; er ist in dieser Rechnung nicht berücksichtigt. Ebenfalls nicht berücksichtigt sind Mietausfälle, Instandhaltungen über die Rücklage hinaus und Kosten einer Anschlussfinanzierung über den angenommenen Zins hinaus.");
  y += 6;
  absatz(y,
    "Unverbindliche Modellrechnung. Sie ersetzt keine Steuerberatung. Die tatsächliche Entwicklung von Miete, Zins und Verkehrswert kann erheblich abweichen.");

  seiten.push(c);

  /* ---- Fußzeilen und Dateiaufbau ---- */
  const inhalte = seiten.map((inhalt, i) => {
    let f = LN(M, H - 52, RE, 0.6);
    f += T(M, H - 38, "Unverbindliche Modellrechnung", "F1", 7, GRAU);
    f += TR(RE, H - 38, "Seite " + (i + 1) + " von " + seiten.length, "F3", 7, GRAU);
    return inhalt + f;
  });

  const objekte = [];
  const anzahl = inhalte.length;
  const seitenIds = inhalte.map((_, i) => 3 + i * 2);
  objekte.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objekte.push(
    `<< /Type /Pages /Kids [${seitenIds.map((id) => id + " 0 R").join(" ")}] /Count ${anzahl} >>`
  );
  const fontStart = 3 + anzahl * 2;
  inhalte.forEach((inhalt, i) => {
    objekte.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] ` +
      `/Resources << /Font << /F1 ${fontStart} 0 R /F2 ${fontStart + 1} 0 R /F3 ${fontStart + 2} 0 R /F4 ${fontStart + 3} 0 R >> >> ` +
      `/Contents ${4 + i * 2} 0 R >>`
    );
    objekte.push(`<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`);
  });
  [["Helvetica"], ["Helvetica-Bold"], ["Courier"], ["Courier-Bold"]].forEach(([n]) =>
    objekte.push(`<< /Type /Font /Subtype /Type1 /BaseFont /${n} /Encoding /WinAnsiEncoding >>`)
  );

  let datei = "%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n";
  const offsets = [0];
  objekte.forEach((o, i) => {
    offsets.push(datei.length);
    datei += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = datei.length;
  datei += `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objekte.length; i++)
    datei += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  datei += `trailer\n<< /Size ${objekte.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(datei.length);
  for (let i = 0; i < datei.length; i++) bytes[i] = datei.charCodeAt(i) & 0xff;
  return bytes;
}

/* ---------- KfW-Vorlagen ----------
   Strukturdaten (Kreditrahmen, Programmlogik) sind stabil; Zinssätze sind
   Richtwerte mit Datumsstempel — die KfW legt den tatsächlichen Zins erst
   am Tag der Zusage fest und veröffentlicht keine feste Konditionentabelle.
   Vor Nutzung immer bei der finanzierenden Bank / kfw.de gegenprüfen. */

