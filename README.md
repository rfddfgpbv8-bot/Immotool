# Investitionsrechner

Rechner für vermietete Eigentumswohnungen: Liquidität, Steuerwirkung nach § 32a EStG
(Tarif 2025/2026, Soli mit Freigrenze und Milderungszone, Kirchensteuer),
degressive AfA und Sonderabschreibung § 7b, Vermögensbetrachtung, CSV- und PDF-Export.

## Lokal starten

```bash
npm install
npm run dev
```

## Auf Vercel veröffentlichen

1. Dieses Verzeichnis in ein GitHub-Repository legen (siehe unten).
2. Auf vercel.com: **Add New… → Project → Import Git Repository**.
3. Vercel erkennt Vite automatisch: Build `npm run build`, Output `dist`.
4. **Deploy** drücken.

Jeder Push auf `main` löst danach ein neues Deployment aus.

### Per Kommandozeile zu GitHub

```bash
git init
git add .
git commit -m "Investitionsrechner"
git branch -M main
git remote add origin https://github.com/<konto>/<repo>.git
git push -u origin main
```

## Hinweis

Unverbindliche Modellrechnung, keine Steuerberatung.
