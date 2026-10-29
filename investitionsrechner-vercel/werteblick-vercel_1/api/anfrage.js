/* Vercel-Funktion: nimmt Anfragen von der Kundenseite entgegen,
   speichert sie in Supabase (Tabelle "anfragen") und schickt eine Mail über Resend.

   Umgebungsvariablen (nur in Vercel eintragen, nie im Code oder in Git):
     RESEND_API_KEY             API-Schlüssel von resend.com
     MAIL_FROM                  Absender, z. B. "Investitionsrechner <anfrage@jacobus-grundbesitz.de>"
                                (die Domain muss bei Resend verifiziert sein)
     MAIL_TO                    Empfänger, Standard: investition@jacobus-grundbesitz.de
     SUPABASE_URL               gleiche URL wie VITE_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY  der geheime service_role-Schlüssel (NICHT der anon-Schlüssel)
*/

const ANLIEGEN = {
  berechnung: "Berechnung besprechen",
  kundenzugang: "Kundenzugang anfragen",
  allgemein: "Allgemeine Frage",
};

const kurz = (v, max) => String(v ?? "").trim().slice(0, max);
const esc = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const eur = (n) => (n == null ? "–" : Math.round(n).toLocaleString("de-DE") + " €");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ fehler: "Nur POST erlaubt." });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};

  // Honeypot: Bots füllen das versteckte Feld. Wir tun so, als wäre alles gut.
  if (kurz(body.website, 200) !== "") return res.status(200).json({ ok: true });

  const name = kurz(body.name, 120);
  const email = kurz(body.email, 200);
  const telefon = kurz(body.telefon, 60);
  const nachricht = kurz(body.nachricht, 4000);
  const anliegen = ANLIEGEN[body.anliegen] ? body.anliegen : "allgemein";

  if (!name) return res.status(400).json({ fehler: "Bitte geben Sie Ihren Namen an." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ fehler: "Bitte geben Sie eine gültige E-Mail-Adresse an." });
  if (body.zustimmung !== true)
    return res.status(400).json({ fehler: "Bitte stimmen Sie der Datenschutzerklärung zu." });

  // Berechnung nur übernehmen, wenn sie ein Objekt ist und nicht riesig
  let berechnung = null;
  if (body.berechnung && typeof body.berechnung === "object") {
    const text = JSON.stringify(body.berechnung);
    if (text.length <= 20000) berechnung = body.berechnung;
  }

  const SUPA_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND = process.env.RESEND_API_KEY;
  const AN = process.env.MAIL_TO || "investition@jacobus-grundbesitz.de";
  const VON = process.env.MAIL_FROM;

  // Einfache Bremse gegen Massenversand: höchstens 5 Anfragen je E-Mail und Stunde
  if (SUPA_URL && SUPA_KEY) {
    try {
      const seit = new Date(Date.now() - 3600 * 1000).toISOString();
      const r = await fetch(
        `${SUPA_URL}/rest/v1/anfragen?select=id&email=eq.${encodeURIComponent(email)}&created_at=gte.${encodeURIComponent(seit)}`,
        { headers: supaHeader(SUPA_KEY) }
      );
      if (r.ok && (await r.json()).length >= 5)
        return res.status(429).json({ fehler: "Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es später erneut." });
    } catch { /* Bremse ist optional */ }
  }

  let gespeichert = false;
  let gemailt = false;

  if (SUPA_URL && SUPA_KEY) {
    try {
      const r = await fetch(`${SUPA_URL}/rest/v1/anfragen`, {
        method: "POST",
        headers: { ...supaHeader(SUPA_KEY), "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ name, email, telefon, anliegen, nachricht, berechnung, status: "neu" }),
      });
      gespeichert = r.ok;
      if (!r.ok) console.error("Supabase-Fehler", r.status, await r.text());
    } catch (err) {
      console.error("Supabase nicht erreichbar", err);
    }
  }

  if (RESEND && VON) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: VON,
          to: [AN],
          reply_to: email,
          subject: `Neue Anfrage: ${ANLIEGEN[anliegen]} – ${name}`,
          html: mailHtml({ name, email, telefon, anliegen, nachricht, berechnung }),
          text: mailText({ name, email, telefon, anliegen, nachricht, berechnung }),
        }),
      });
      gemailt = r.ok;
      if (!r.ok) console.error("Resend-Fehler", r.status, await r.text());
    } catch (err) {
      console.error("Resend nicht erreichbar", err);
    }
  }

  if (!gespeichert && !gemailt) {
    return res.status(500).json({ fehler: "Die Anfrage konnte gerade nicht verarbeitet werden." });
  }
  return res.status(200).json({ ok: true });
}

function safeJson(t) {
  try { return JSON.parse(t); } catch { return {}; }
}
function supaHeader(key) {
  // Neue Schlüssel (sb_secret_…) gehören nur in den apikey-Header, alte JWT-Schlüssel auch in Authorization.
  return key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

function zeilen({ name, email, telefon, anliegen, nachricht, berechnung }) {
  const z = [
    ["Anliegen", ANLIEGEN[anliegen]],
    ["Name", name],
    ["E-Mail", email],
    ["Telefon", telefon || "–"],
    ["Nachricht", nachricht || "–"],
  ];
  if (berechnung) {
    const e = berechnung.ergebnis || {};
    const i = berechnung.eingaben || {};
    z.push(
      ["Immobilie", `${berechnung.projekt || "–"}, ${berechnung.wohnung || "–"}${berechnung.adresse ? " (" + berechnung.adresse + ")" : ""}`],
      ["Hinweis", berechnung.beispielwerte ? "Berechnung mit Beispielwerten" : "Berechnung mit eigenen Angaben des Kunden"],
      ["Kaufpreis", i.kaufpreis == null ? "–" : eur(i.kaufpreis)],
      ["Wohnfläche / Monatsmiete", i.wohnflaeche == null ? "–" : `${i.wohnflaeche} m² / ${eur(i.miete)}`],
      ["Einkommen (zvE)", eur(i.einkommen) + ", " + (i.veranlagung === "einzeln" ? "Einzelveranlagung" : "Zusammenveranlagung")],
      ["Gesamtkosten", eur(e.gesamtkosten)],
      ["Eigenkapital", eur(e.eigenkapital)],
      ["Darlehen", eur(e.darlehen)],
      ["Zins / Tilgung Bank", `${i.zins ?? "–"} % / ${i.tilgung ?? "–"} %`],
      ["Wertsteigerung / Verkauf", `${i.wertSteigerung ?? "–"} % p. a. / ${e.verkaufsJahr ?? "–"}`],
      ["Ø monatlich nach Steuern", eur(e.monatlichNachSteuern) + (e.monatlichNachSteuern > 0 ? " (Aufwand)" : " (Überschuss)")],
      ["Steuerersparnis gesamt", eur(e.steuerersparnis)],
      ["Vermögenszuwachs nach Verkauf", eur(e.vermoegenNachVerkauf)],
      ["Rendite p. a. nach Steuern", e.renditeProzent == null ? "–" : String(e.renditeProzent).replace(".", ",") + " %"]
    );
  }
  return z;
}

function mailText(d) {
  return zeilen(d).map(([k, v]) => `${k}: ${v}`).join("\n");
}
function mailHtml(d) {
  const reihen = zeilen(d)
    .map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#555;vertical-align:top">${esc(k)}</td><td style="padding:6px 0"><strong>${esc(v)}</strong></td></tr>`)
    .join("");
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1d211f"><h2 style="margin:0 0 12px">Neue Anfrage über den Investitionsrechner</h2><table style="border-collapse:collapse">${reihen}</table></div>`;
}
