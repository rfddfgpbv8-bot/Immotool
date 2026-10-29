# Investitionsrechner

Kundenseite (`/`) mit Landingpage, Projekten, vereinfachtem Rechner und Anfrageformular.
Teamansicht (`/team`) mit dem vollständigen Rechner, den Kundenanfragen und gespeicherten Berechnungen.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/rechenkern.js` | Steuer (§ 32a EStG), AfA, Finanzierung, Veräußerung |
| `src/projekte.js` | Projekte, Wohnungen (aktuell Platzhalter), Umrechnung Kundeneingaben → Rechenzustand |
| `src/vorlagen.js` | KfW-Programme und Startwerte |
| `src/KundenApp.jsx` | Landingpage und Kundenrechner |
| `src/TeamApp.jsx` | Teamansicht (Login, Anfragen, Expertenrechner) |
| `api/anfrage.js` | Vercel-Funktion: speichert Anfragen und sendet die Mail |
| `supabase/setup.sql` | Tabellen und Zugriffsregeln |

## Vor dem öffentlichen Start

1. In `src/projekte.js` echte Preise, Flächen, Mieten, Standort, Grunderwerbsteuer und Beratungsgebühr eintragen, dann `PLATZHALTER_AKTIV = false` setzen.
2. Impressum und Datenschutz in `src/KundenApp.jsx` (ganz unten) ausfüllen.
3. Supabase einrichten: `supabase/setup.sql` im SQL Editor ausführen, Teamkonten anlegen und Rolle vergeben (steht im Skript).
4. Resend: Konto anlegen, Domain `jacobus-grundbesitz.de` verifizieren, API-Schlüssel erzeugen.
5. In Vercel unter Settings → Environment Variables alle Werte aus `.env.example` eintragen, danach „Redeploy“.
