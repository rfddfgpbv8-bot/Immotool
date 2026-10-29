/* ============================================================
   Projekte und Wohnungen für den Kundenrechner

   ACHTUNG: Alle Zahlen hier sind PLATZHALTER (Beispielwerte).
   Vor dem öffentlichen Start durch echte Werte ersetzen:
   Kaufpreise, Flächen, Mieten, Standort, Grunderwerbsteuer,
   Beratungsgebühr, Fertigstellungstermine.
   Später können diese Daten aus dem CRM oder von der
   Reservierungsseite kommen – dann ersetzt eine Ladefunktion
   die Liste PROJEKTE, der Rest bleibt unverändert.
   ============================================================ */

import { START, KFW_VORLAGEN } from "./vorlagen.js";
import { berechne } from "./rechenkern.js";

export const PROJEKTE = [
  {
    id: "eins-vier-null",
    name: "Eins Vier Null",
    adresse: "Lönsstraße 140",
    ort: "Ort folgt",
    art: "neubau",
    artLabel: "Neubau",
    kfwId: "kfw298-eh40-qng",
    kurz: "Klimafreundlicher Neubau, Effizienzhaus 40 mit QNG-Siegel, Gebäudeklasse 2.",
    // nur zur Information, fließt nicht in die Rechnung ein
    infos: ["Gebäudeklasse 2", "Effizienzhaus 40 mit QNG", "Neubau mit degressiver AfA und Sonder-AfA"],
    reservierungsUrl: "", // später: Link zur Reservierungsseite
    basis: {
      grestSatz: 6.5,
      notarSatz: 2.0,
      beratungSatz: 3.57, // 3 % zzgl. 19 % USt
      gebaeudeAnteil: 80,
      kaufvertragJahr: 2026, kaufvertragMonat: 12,
      fertigJahr: 2028, fertigMonat: 6,
      vermietungJahr: 2028, vermietungMonat: 7,
      darlehenBeginn: 2028,
      mietSteigerungAb: 2030,
      zuschussBetrag: 0,
    },
    einheiten: [
      { id: "we01", bezeichnung: "WE 01 · 2 Zimmer", wohnflaeche: 46.8,  kaufpreis: 262000, stellplatzPreis: 15000, mieteProQm: 16.5 },
      { id: "we02", bezeichnung: "WE 02 · 3 Zimmer", wohnflaeche: 71.2,  kaufpreis: 399000, stellplatzPreis: 15000, mieteProQm: 16.2 },
      { id: "we03", bezeichnung: "WE 03 · 2 Zimmer", wohnflaeche: 54.5,  kaufpreis: 305000, stellplatzPreis: 15000, mieteProQm: 16.7 },
    ],
  },
  {
    id: "the-sixteen",
    name: "The Sixteen",
    adresse: "Adresse folgt",
    ort: "Ort folgt",
    art: "denkmal",
    artLabel: "Denkmal",
    kfwId: "kfw261-denkmal",
    kurz: "Denkmalsanierung mit erhöhter Abschreibung nach §§ 7h/7i EStG.",
    infos: ["Denkmalgeschütztes Gebäude", "Abschreibung nach § 7h/7i EStG", "KfW 261 pauschal als Platzhalter"],
    reservierungsUrl: "",
    basis: {
      grestSatz: 6.5,
      notarSatz: 2.0,
      beratungSatz: 3.57, // 3 % zzgl. 19 % USt
      gebaeudeAnteil: 70,
      kaufvertragJahr: 2026, kaufvertragMonat: 12,
      fertigJahr: 2027, fertigMonat: 12,
      vermietungJahr: 2028, vermietungMonat: 1,
      darlehenBeginn: 2028,
      mietSteigerungAb: 2030,
      zuschussBetrag: 0,
      denkmalSanierungsanteil: 60,
    },
    einheiten: [
      { id: "we1", bezeichnung: "WE 1 · 2 Zimmer", wohnflaeche: 52.0, kaufpreis: 249000, stellplatzPreis: 0, mieteProQm: 14.5 },
      { id: "we2", bezeichnung: "WE 2 · 3 Zimmer", wohnflaeche: 78.0, kaufpreis: 389000, stellplatzPreis: 0, mieteProQm: 14.2 },
      { id: "we3", bezeichnung: "WE 3 · 2 Zimmer", wohnflaeche: 45.0, kaufpreis: 214000, stellplatzPreis: 0, mieteProQm: 14.8 },
    ],
  },
];

/* Eingaben, die der Kunde ändern darf.
   Der Kundenrechner arbeitet im freien Modus (keine projektId): Der Kunde gibt
   die Immobilie selbst ein. Mit projektId und einheitId rechnet baueStaat weiterhin
   mit den hinterlegten Projekten (z. B. für die Teamansicht). */
export const KUNDEN_STANDARD = {
  art: "neubau",           // "neubau" | "denkmal"
  kaufpreis: 300000,       // € inkl. Stellplatz
  wohnflaeche: 55,         // m²
  miete: 900,              // € Kaltmiete pro Monat
  grestSatz: 6.5,          // Grunderwerbsteuer in % (je Bundesland 3,5 bis 6,5)
  nebenSatz: 2.0,          // Notar, Gericht, ggf. Makler in %
  vermietungJahr: 2028,    // Start der Vermietung
  kfw: false,              // KfW-Förderdarlehen berücksichtigen
  einkommen: 100000,
  veranlagung: "zusammen", // "zusammen" (Splitting) | "einzeln"
  eigenkapital: null,      // null = Vorschlag (ca. 12 % der Gesamtkosten)
  zins: 3.8,               // Bankdarlehen, % p.a.
  tilgung: 1.5,            // Bankdarlehen, % p.a.
  wertSteigerung: 2,       // % p.a.
  verkaufsJahr: 2038,
};

export const projektVon = (id) => PROJEKTE.find((p) => p.id === id) || PROJEKTE[0];
export const einheitVon = (p, id) => p.einheiten.find((e) => e.id === id) || p.einheiten[0];

/* Grunddaten für die Rechnung: entweder aus einem hinterlegten Projekt
   (projektId gesetzt) oder aus der freien Eingabe des Kunden. */
export function kontext(e) {
  if (e.projektId) {
    const projekt = projektVon(e.projektId);
    const einheit = einheitVon(projekt, e.einheitId);
    return {
      art: projekt.art, name: projekt.name, standort: projekt.adresse,
      kfwId: projekt.kfwId, basis: projekt.basis, einheit,
      bezeichnung: einheit.bezeichnung,
    };
  }
  const art = e.art === "denkmal" ? "denkmal" : "neubau";
  const vorlage = PROJEKTE.find((p) => p.art === art);
  const flaeche = Math.max(10, e.wohnflaeche || 0);
  const jahr = Math.round(e.vermietungJahr);
  return {
    art, name: "Eigene Immobilie", standort: "",
    kfwId: e.kfw ? vorlage.kfwId : null,
    // Gebäudeanteil und Sanierungsanteil übernehmen wir aus den Vorlagen je Art
    basis: {
      ...vorlage.basis,
      grestSatz: e.grestSatz, notarSatz: e.nebenSatz, beratungSatz: 0,
      fertigJahr: jahr, fertigMonat: 6,
      vermietungJahr: jahr, vermietungMonat: 7,
      darlehenBeginn: jahr, mietSteigerungAb: jahr + 2,
    },
    einheit: {
      wohnflaeche: flaeche, kaufpreis: e.kaufpreis, stellplatzPreis: 0,
      mieteProQm: Math.round(((e.miete || 0) / flaeche) * 10000) / 10000,
    },
    bezeichnung: art === "denkmal" ? "Denkmal" : "Neubau",
  };
}

/* Kosten ohne Finanzierung, für den EK-Vorschlag */
function gesamtkostenVon(basis, einheit) {
  const kaufGesamt = einheit.kaufpreis + einheit.stellplatzPreis;
  const b = { ...START, ...basis };
  return kaufGesamt * (1 + (b.grestSatz + b.notarSatz + b.beratungSatz) / 100);
}

export function ekVorschlag(e) {
  const k = kontext(e);
  return Math.round((gesamtkostenVon(k.basis, k.einheit) * 0.12) / 500) * 500;
}

/* Baut aus Eingaben den vollständigen Rechenzustand für den Rechenkern
   (dieselbe Rechnung wie in der Teamansicht). */
export function baueStaat(e) {
  const k = kontext(e);
  const einheit = k.einheit;
  const kfw = k.kfwId ? KFW_VORLAGEN.find((v) => v.id === k.kfwId) : null;

  const eigenkapitalWunsch = e.eigenkapital == null ? ekVorschlag(e) : e.eigenkapital;
  const gesamtkosten = gesamtkostenVon(k.basis, einheit);
  const eigenkapital = Math.max(0, Math.min(Math.round(eigenkapitalWunsch), Math.round(gesamtkosten)));
  const bedarf = Math.max(0, gesamtkosten - eigenkapital);

  const kfwBetrag = kfw ? Math.min(kfw.betrag, Math.round(bedarf)) : 0;
  const bankBetrag = Math.max(0, Math.round(bedarf) - kfwBetrag);

  const darlehen = [];
  if (kfw && kfwBetrag > 0)
    darlehen.push({
      name: kfw.name, betrag: kfwBetrag, zins: kfw.zins, tilgung: kfw.tilgung,
      zinsbindung: kfw.zinsbindung, anschlusszins: kfw.anschlusszins,
    });
  if (bankBetrag > 0)
    darlehen.push({
      name: "Bankdarlehen", betrag: bankBetrag, zins: e.zins, tilgung: e.tilgung,
      zinsbindung: 10, anschlusszins: Math.max(e.zins, 3.5),
    });

  const verkauf = Math.max(2032, Math.min(2050, Math.round(e.verkaufsJahr)));

  return {
    ...START,
    ...k.basis,
    projektName: k.name,
    standort: k.standort,
    kundeName: "",
    gebaeudeart: k.art,
    wohnflaeche: einheit.wohnflaeche,
    bgf: Math.round(einheit.wohnflaeche * 1.14 * 100) / 100,
    kaufpreis: einheit.kaufpreis,
    stellplatzPreis: einheit.stellplatzPreis,
    mieteProQm: einheit.mieteProQm,
    stellplatzMiete: einheit.stellplatzPreis > 0 ? 70 : 0,
    splitting: e.veranlagung === "zusammen",
    steuerklasse: e.veranlagung === "zusammen" ? "III" : "I",
    kirchensteuer: 0,
    kinderfreibetraege: 0,
    zvE: e.einkommen,
    eigenkapital,
    darlehen,
    wertSteigerung: e.wertSteigerung,
    endJahr: verkauf,
    veraeusserungAktiv: true,
    veraeusserungJahr: verkauf,
    veraeusserungMonat: 12,
    verkaufskostenSatz: 0,
  };
}

/* Kennzahlen für Kundenansicht und Mailversand */
export function kundenErgebnis(e) {
  const s = baueStaat(e);
  const r = berechne(s);
  const v = r.veraeusserung;
  const vermoegen = v
    ? v.nettoerloes - r.eigenkapital - r.kumAufwandVorSteuern + r.kumSteuerersparnis
    : r.ueberschuss;
  return {
    s, r, v,
    vermoegen,
    kfwDarlehen: s.darlehen.find((d) => d.name !== "Bankdarlehen") || null,
    bankDarlehen: s.darlehen.find((d) => d.name === "Bankdarlehen") || null,
  };
}

/* Solange das auf true steht, zeigt die Kundenseite den Hinweis „Beispielwerte“.
   Erst auf false setzen, wenn PROJEKTE mit echten Preisen, Flächen und Mieten befüllt ist. */
export const PLATZHALTER_AKTIV = false;

/* Marke und Kontakt – hier zentral änderbar */
export const MARKE = {
  name: "Werteblick",
  mail: "investition@jacobus-grundbesitz.de",
};
