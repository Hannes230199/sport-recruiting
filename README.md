# Sport Recruiting Platform

Eine Plattform, die zwei Dinge verbindet:

1. **Jobboard** – täglich gescrapte Stellenangebote aus 5 deutschen
   Sport-Jobbörsen, gebündelt, gefiltert und durchsuchbar.
2. **Bewerberportal** – Kandidat:innen laden einmal ihre Unterlagen hoch,
   werden automatisch mit passenden Jobs gematcht, können sich bewerben und
   behalten den Überblick über alle Bewerbungen.

## Tech-Stack

| Bereich            | Technologie                                              |
| ------------------ | --------------------------------------------------------- |
| Frontend           | Next.js 14 (App Router), TypeScript, Tailwind CSS         |
| Backend / DB       | Supabase (Postgres, Auth, Storage, Row Level Security)    |
| Scraping           | Node + `cheerio`, ausgeführt via `tsx`                    |
| Hosting (geplant)  | Vercel (App) + Supabase (DB/Auth/Storage)                 |
| Scheduling         | Vercel Cron (täglicher Scrape-Job)                        |

## Projektstruktur

```
sport-recruiting/
├── src/
│   ├── middleware.ts             # Refresht die Supabase-Session bei jedem Request
│   ├── app/                    # Next.js App Router Seiten
│   │   ├── page.tsx             # Startseite (neueste Jobs aus Supabase)
│   │   ├── jobs/page.tsx        # Job-Übersicht mit Filtern (Supabase-Query)
│   │   ├── jobs/[id]/page.tsx   # Job-Detailseite + Match-Score + "Jetzt bewerben"
│   │   ├── jobs/[id]/actions.ts # Server Action: Bewerbung anlegen/aktualisieren
│   │   ├── profil/page.tsx      # Kandidatenprofil, Dokumente, Matches (Login nötig)
│   │   ├── profil/actions.ts    # Server Actions: Profil speichern, Dokument hochladen/entfernen
│   │   ├── bewerbungen/page.tsx # Bewerbungs-Dashboard (Login nötig)
│   │   ├── recruiter/page.tsx    # Recruiter-Bereich: alle Bewerbungen, Status-Updates (nur is_recruiter)
│   │   ├── recruiter/actions.ts  # Server Action: Status/Notizen aktualisieren
│   │   ├── login/                # Magic-Link-Login (Formular + Server Action)
│   │   └── auth/
│   │       ├── callback/route.ts # PKCE-Callback für Magic Links
│   │       └── signout/route.ts  # Logout (POST)
│   ├── components/              # Wiederverwendbare UI-Komponenten
│   ├── lib/
│   │   ├── types.ts             # Zentrale Domain-Typen (Job, Application, ...)
│   │   ├── mockData.ts          # Beispieldaten (nicht mehr verwendet, nur Referenz)
│   │   ├── matching.ts           # Regelbasierte Matching-Logik (Score 0-100)
│   │   ├── data/                 # Data-Layer: snake_case DB-Rows -> Domain-Typen
│   │   │   ├── jobs.ts            # getLatestJobs, getJobs, getJobById, getJobCategories
│   │   │   ├── profile.ts         # getOrCreateProfile, updateProfile, Dokumente, isRecruiter
│   │   │   └── applications.ts    # getApplications, getApplicationForJob, createOrUpdateApplication, getAllApplications, updateApplicationStatus
│   │   └── supabase/             # Browser-, Server-, Middleware- und Admin-Clients
│   └── scrapers/
│       ├── types.ts              # Scraper-Interface & ScrapedJob-Typ
│       ├── normalize.ts          # Gemeinsame Normalisierungs-Helfer
│       ├── runner.ts             # Orchestriert alle Scraper + DB-Upsert
│       └── sources/              # Ein Scraper pro Jobbörse
└── supabase/
    └── migrations/
        ├── 0001_init.sql          # DB-Schema (Tabellen, RLS, Storage)
        └── 0002_recruiter.sql     # Recruiter-Rolle (is_recruiter) + RLS-Policies
```

## Datenmodell (Kurzüberblick)

- **jobs** – gescrapte Stellenangebote, dedupliziert über
  `(source, external_id)`, mit deutscher Volltextsuche (`search_vector`).
- **candidate_profiles** – 1:1 zu `auth.users`, enthält Skills, Sportarten,
  Wunschrollen/-orte/-anstellungsarten sowie das Flag `is_recruiter`
  (Recruiter-Rolle, siehe Abschnitt „Recruiter-Bereich“).
- **candidate_documents** – Metadaten zu hochgeladenen Dateien (CV,
  Zertifikate, ...), Dateien selbst liegen im privaten Storage-Bucket
  `candidate-documents`.
- **applications** – verknüpft Kandidat:in + Job, Status (Entwurf,
  Eingereicht, In Prüfung, Interview, Angebot, Abgelehnt, Zurückgezogen) und
  Match-Score.

Alle Tabellen haben Row Level Security aktiviert. Jobs sind öffentlich
lesbar (Schreiben nur über den Service-Role-Key, z.B. durch den Scraper).
Profile/Dokumente/Bewerbungen sind grundsätzlich nur für den jeweiligen
Kandidaten sichtbar (`auth.uid()`); zusätzlich dürfen Nutzer:innen mit
`is_recruiter = true` alle Profile lesen sowie alle Bewerbungen lesen und
aktualisieren (siehe `0002_recruiter.sql`).

## Lokales Setup

### Voraussetzungen

- Node.js ≥ 18.18 (empfohlen: 20.x)
- Ein Supabase-Projekt (kostenloser Plan reicht zum Start)

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen

```bash
cp .env.example .env.local
```

Dann ausfüllen:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` – aus
  Supabase-Projekt → Project Settings → API.
- `SUPABASE_SERVICE_ROLE_KEY` – ebenfalls aus Project Settings → API
  (**niemals** im Frontend verwenden, nur für Scraper/Server-Code).
- `SCRAPER_USER_AGENT` – wird beim Scrapen als User-Agent gesendet, idealerweise
  mit Kontakt-E-Mail (siehe Beispiel in `.env.example`).
- `CRON_SECRET` – beliebiges Secret, das den Cron-Endpoint
  (`/api/scrape-trigger`) absichert (siehe Abschnitt „Deployment“).
- `NEXT_PUBLIC_SITE_URL` – Basis-URL der App (lokal `http://localhost:3000`),
  wird für den Magic-Link-Redirect benötigt (siehe Abschnitt „Auth“).

### 3. Datenbankschema anlegen

Im Supabase Dashboard → SQL Editor den Inhalt von
`supabase/migrations/0001_init.sql` und danach `0002_recruiter.sql`
ausführen (oder via Supabase CLI: `supabase db push`).

### 4. Storage-Bucket

Die Migration legt den privaten Bucket `candidate-documents` inkl.
RLS-Policies an. Falls der Bucket über das Dashboard erstellt wird, darauf
achten, dass er **privat** ist und die Policies aus der Migration übernommen
werden.

### 5. Auth (Magic Link) konfigurieren

Im Supabase Dashboard unter **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (lokal) bzw. die Produktions-Domain.
- **Redirect URLs**: `http://localhost:3000/auth/callback` und die
  entsprechende Produktions-URL (z.B.
  `https://<dein-projekt>.vercel.app/auth/callback`) hinzufügen – sonst
  schlägt der Magic-Link-Login mit „redirect URL not allowed“ fehl.

Mehr Details siehe Abschnitt „Auth“ weiter unten.

### 6. Entwicklungsserver starten

```bash
npm run dev
```

Die App läuft danach unter `http://localhost:3000`. Alle Seiten greifen auf
echte Supabase-Daten zu (siehe Abschnitt „Auth“ und „Data-Layer“).

## Scraper

Jede der 5 Quellen hat einen eigenen Scraper unter `src/scrapers/sources/`:

| Quelle                  | Datei                   | Status                                                                 |
| ------------------------ | ------------------------ | ----------------------------------------------------------------------- |
| JobsImSport.de            | `jobsimsport.ts`          | Verifiziert: Beiträge in `.posts .hentry`, Titel-Link `h2.post-title a`, Datum aus `.post-meta`, Beschreibung aus `.post-content` |
| Sport-Job.com              | `sportJob.ts`             | Verifiziert: Karten in `.job-item-container`, Titel/Firma aus `.text-container p strong`/`i`, Metadaten aus `.row` |
| SPOBIS Jobs                | `spobisJobs.ts`           | Verifiziert: Webflow-Klassen `.home_job_title`, `.home_job_employment_type`, `.home-company-link .is_company`, Ort/Kategorie aus `.tags_wrapper .tags_list-item` |
| Joborama.de                 | `joborama.ts`             | Verifiziert: Kategorie-Karten `section.job-cards article.card`, Jobs als `a.job-item-link` mit `.job-title`/`.job-company`, „Alle Jobs“-Links für weitere Treffer |
| DSHS Köln Jobbörse          | `dshsKoeln.ts`            | Verifiziert: nutzt die JSON-API `/api/v1/jobs?page=1&limit=N&premium=0` direkt (Stellenliste ist clientseitig gerendert, aber die API ist öffentlich erreichbar) |

### Ausführen

```bash
# Nur anzeigen, keine DB-Schreibvorgänge:
npm run scrape:dry

# In die Supabase-jobs-Tabelle schreiben (Upsert über source+external_id):
npm run scrape

# Anzahl Jobs pro Quelle begrenzen (z.B. zum Testen):
SCRAPE_LIMIT=3 npm run scrape:dry
```

Der Runner (`src/scrapers/runner.ts`) läuft pro Quelle isoliert – schlägt
eine Quelle fehl (z.B. DSHS Köln), werden die anderen trotzdem verarbeitet.

### Offene Punkte bei den Scrapern

Alle 5 Scraper wurden per Browser-Zugriff gegen die aktuelle Live-Struktur
der jeweiligen Seite verifiziert und entsprechend angepasst (Stand: Juni
2026). Da Seitenbetreiber ihre Strukturen jederzeit ändern können, sollten
die Selektoren bei auffällig sinkenden Job-Zahlen erneut geprüft werden:

- **JobsImSport.de**: Theme/Markup wurde komplett umgestellt (kein
  `<article>`/`<time>` mehr) – jetzt `.posts .hentry`, `h2.post-title a`,
  `.post-meta` (Freitext-Datum), `.post-content`.
- **Sport-Job.com**: Der bisherige Container-Heuristik-Ansatz traf den
  falschen Wrapper (nur Standort/Stellenart/Online-seit, ohne Titel/Firma).
  Jetzt werden die 16 `.job-item-container`-Karten direkt iteriert; Titel und
  Firma kommen aus `.text-container p strong`/`p i`.
- **SPOBIS Jobs**: Die frühere Text-Heuristik wurde durch konkrete
  Webflow-Klassen ersetzt (`.home_job_title`, `.home_job_employment_type`,
  `.home-company-link .is_company`, `.tags_wrapper .tags_list-item` für
  Ort/Tätigkeitsbereich).
- **Joborama.de**: Die bisherige Überschriften-Traversal-Logik fand 0
  Treffer (keine `nextElementSibling` mehr vorhanden). Jetzt werden
  `section.job-cards article.card` iteriert; Jobs sind `a.job-item-link` mit
  `.job-title`/`.job-company`. „Alle Jobs“-Links liefern pro Kategorie deutlich
  mehr Treffer (z.B. 14 statt 4 bei „Sport & Management“).
- **DSHS Köln**: Der bisherige Stub (`[]`) wurde ersetzt – die Seite lädt
  ihre Stellenliste über die öffentliche JSON-API
  `https://jobs.dshs-koeln.de/api/v1/jobs?page=1&limit=N&premium=0`
  (Antwort: `{ data: [...], meta: { totalItems, ... } }`). Detail-URLs folgen
  dem Muster `/jobs/{id}/{slug}/`, wobei `{slug}` aus dem Titel abgeleitet
  wird (Umlaute transliteriert, Sonderzeichen entfernt).

## Matching-Logik

`src/lib/matching.ts` enthält ein einfaches, erklärbares Scoring (0-100):

| Kriterium            | Gewicht |
| --------------------- | ------- |
| Sportart-Match         | 30      |
| Rollen-Match           | 25      |
| Skill-Überlappung      | 25      |
| Standort-Match         | 10      |
| Anstellungsart-Match   | 10      |

`scoreJobForCandidate()` liefert neben dem Score auch menschenlesbare
Begründungen (`reasons`), die im UI angezeigt werden (siehe
Job-Detailseite und Profilseite). Das kann später durch ein
Embedding-/LLM-basiertes Matching ergänzt oder ersetzt werden, ohne dass
sich die Aufrufer ändern müssen.

## Auth (Magic Link)

Die Plattform nutzt **passwortlose Anmeldung** via Supabase Auth
(`signInWithOtp` + PKCE-Flow):

- `/login` – Formular zur E-Mail-Eingabe (Server Action
  `src/app/login/actions.ts` → `signInWithOtp`). Beim ersten Login wird
  automatisch ein `auth.users`-Eintrag angelegt.
- `/auth/callback` – tauscht den `code`-Parameter aus dem Magic-Link gegen
  eine Session (`exchangeCodeForSession`) und leitet danach zu `next`
  weiter (Standard: `/profil`).
- `/auth/signout` – POST-Endpoint, der die Session beendet (Button im
  Header).
- `src/middleware.ts` + `src/lib/supabase/middleware.ts` – refreshen das
  Session-Cookie bei jedem Request (`supabase.auth.getUser()`), damit
  Server Components immer einen aktuellen Auth-Status sehen.

Seiten, die einen eingeloggten Kandidaten benötigen (`/profil`,
`/bewerbungen`), prüfen `supabase.auth.getUser()` und leiten andernfalls per
`redirect("/login?next=<pfad>")` weiter; nach erfolgreichem Login landet man
wieder auf der ursprünglich angeforderten Seite.

**Wichtig für den Betrieb**: Damit die Magic-Link-E-Mails auf die richtige
Domain verweisen, müssen in Supabase unter **Authentication → URL
Configuration** die Site URL und Redirect URLs gepflegt sein (siehe „Lokales
Setup“ Schritt 5) – sonst funktioniert der Login-Flow nicht.

## Data-Layer (`src/lib/data/`)

Bildet snake_case Postgres-Zeilen auf die camelCase-Typen aus
`src/lib/types.ts` ab und kapselt alle Supabase-Queries:

- **`jobs.ts`**: `getLatestJobs` (Startseite), `getJobs` (Filter/Suche für
  `/jobs`), `getJobById` (Detailseite), `getJobCategories` (Filter-Dropdown).
- **`profile.ts`**: `getOrCreateProfile` (legt beim ersten Login ein leeres
  Profil an), `updateProfile` (Profilformular), `getCandidateDocuments`
  (signierte Storage-URLs), `uploadCandidateDocument` (Upload in den Bucket
  `candidate-documents` + Eintrag in `candidate_documents`),
  `deleteCandidateDocument`, `isRecruiter` (leichte Rollenprüfung für die
  Navigation).
- **`applications.ts`**: `getApplications` (Bewerbungs-Dashboard, inkl.
  Job-Join), `getApplicationForJob` (Status auf der Job-Detailseite),
  `createOrUpdateApplication` (Server Action „Jetzt bewerben“, Upsert über
  `candidate_id+job_id`), `getAllApplications` (Recruiter-Bereich, inkl.
  Job- und Kandidat:innen-Join), `updateApplicationStatus`
  (Recruiter-Bereich, Status + Notizen).

Diese Module nutzen `rankJobsForCandidate`/`scoreJobForCandidate` aus
`src/lib/matching.ts` unverändert weiter.

## Recruiter-Bereich

`/recruiter` zeigt eine Übersicht aller eingegangenen Bewerbungen
(Kandidat:in, Job, Match-Score, Bewerbungsdatum, Status) und erlaubt es,
Status und interne Notizen pro Bewerbung zu ändern (`updateStatus` Server
Action in `src/app/recruiter/actions.ts`). Die Seite ist nach Status
filterbar.

**Zugriff**: nur eingeloggte Nutzer:innen mit `candidate_profiles.is_recruiter
= true`. Ohne diese Rolle wird eine „Kein Zugriff"-Meldung angezeigt; nicht
eingeloggte Nutzer:innen werden zu `/login?next=/recruiter` weitergeleitet.
Der Header zeigt den Navigationspunkt „Recruiter" nur an, wenn die Rolle
gesetzt ist.

**Recruiter-Zugang vergeben**: `is_recruiter` wird bewusst nicht über das
Profilformular gesetzt, sondern manuell im Supabase SQL Editor:

```sql
update candidate_profiles
set is_recruiter = true
where email = 'recruiterin@beispiel.de';
```

Die Person muss sich vorher mindestens einmal eingeloggt haben, damit der
`candidate_profiles`-Eintrag existiert (wird bei erstem Login automatisch
angelegt, siehe `getOrCreateProfile`).

**Technische Umsetzung** (`0002_recruiter.sql`):

- Neue Spalte `candidate_profiles.is_recruiter boolean default false`.
- `security definer`-Funktion `is_recruiter()`, die prüft, ob das Profil des
  eingeloggten Nutzers (`auth.uid()`) `is_recruiter = true` gesetzt hat
  (umgeht dabei bewusst RLS, um Rekursion in der eigenen Policy zu
  vermeiden).
- Zusätzliche RLS-Policies: Recruiter:innen dürfen alle `candidate_profiles`
  lesen sowie alle `applications` lesen und aktualisieren.

## Nächste Schritte

1. **Supabase-Anbindung der Seiten**: ✅ erledigt – `/`, `/jobs`,
   `/jobs/[id]`, `/profil` und `/bewerbungen` laden echte Daten über
   `src/lib/data/*`.
2. **Auth**: ✅ Magic-Link-Login eingerichtet, Profil-/Bewerbungsseiten hinter
   Login (siehe Abschnitt „Auth“).
3. **Datei-Upload**: ✅ erledigt – Profilseite zeigt vorhandene Dokumente
   (`getCandidateDocuments`), kann neue hochladen
   (`uploadCandidateDocument`, Server Action `uploadDocument`: Validierung
   von Dateityp/-größe, Ablage in `candidate-documents`) und löschen
   (`deleteCandidateDocument`).
4. **Bewerbungsworkflow**: ✅ "Jetzt bewerben" legt eine `applications`-Zeile
   an (`createOrUpdateApplication`, Status `submitted`). Status-Updates
   (z.B. „In Prüfung“, „Interview“) durch Recruiter:innen sind über den neuen
   Recruiter-Bereich (`/recruiter`, siehe Abschnitt „Recruiter-Bereich“)
   möglich.
5. **Cron-Job für Scraper**: ✅ bereits eingerichtet, siehe Abschnitt
   „Deployment“ unten (`/api/scrape-trigger` + `vercel.json`).
6. **DSHS Köln & Selektor-Verifizierung**: ✅ erledigt – alle 5 Scraper mit
   Browser-Zugriff gegen die Live-Struktur verifiziert und angepasst, DSHS
   Köln nutzt jetzt die JSON-API statt des Stubs (siehe „Offene Punkte bei
   den Scrapern“ oben).
7. **Deployment**: siehe Abschnitt „Deployment“ unten.

## Deployment (Vercel + Supabase)

### 1. Supabase-Projekt vorbereiten

- Projekt unter [supabase.com](https://supabase.com) anlegen (falls noch
  nicht vorhanden).
- `supabase/migrations/0001_init.sql` im SQL Editor ausführen (siehe
  „Lokales Setup“ oben).
- Unter **Project Settings → API** notieren: Project URL, `anon`-Key und
  `service_role`-Key.

### 2. Repo mit Vercel verbinden

- Auf [vercel.com](https://vercel.com) ein neues Projekt aus diesem
  Git-Repository anlegen.
- Vercel erkennt Next.js automatisch (Framework Preset „Next.js“, Build
  Command `next build`, Output ist automatisch korrekt) – keine
  Anpassungen nötig.

### 3. Umgebungsvariablen in Vercel setzen

Unter **Project Settings → Environment Variables** (für „Production“ und
optional „Preview“):

| Variable                          | Wert                                      |
| ---------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase Project URL                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Supabase `anon`-Key                        |
| `SUPABASE_SERVICE_ROLE_KEY`         | Supabase `service_role`-Key (geheim!)      |
| `SCRAPER_USER_AGENT`                | z.B. `SportRecruitingBot/0.1 (+mailto:...)` |
| `CRON_SECRET`                       | beliebiges, langes Zufalls-Secret          |
| `NEXT_PUBLIC_SITE_URL`              | Produktions-Domain, z.B. `https://<dein-projekt>.vercel.app` |

Wichtig: `SUPABASE_SERVICE_ROLE_KEY` und `CRON_SECRET` **ohne**
`NEXT_PUBLIC_`-Prefix setzen, damit sie nicht ans Frontend ausgeliefert
werden.

Zusätzlich im Supabase Dashboard unter **Authentication → URL
Configuration** die Site URL und Redirect URLs auf die Vercel-Domain
(`https://<dein-projekt>.vercel.app/auth/callback`) erweitern – siehe
Abschnitt „Auth“.

### 4. Täglicher Scraper-Cron-Job

`vercel.json` enthält bereits einen Cron-Eintrag, der täglich um 04:00 UTC
`/api/scrape-trigger` aufruft:

```json
{
  "crons": [
    { "path": "/api/scrape-trigger", "schedule": "0 4 * * *" }
  ]
}
```

- Sobald die Umgebungsvariable `CRON_SECRET` gesetzt ist, schickt Vercel bei
  Cron-Aufrufen automatisch den Header `Authorization: Bearer <CRON_SECRET>`
  mit – der Endpoint prüft das (`src/app/api/scrape-trigger/route.ts`) und
  lehnt unautorisierte Aufrufe ab.
- Manuell testen (z.B. nach dem Deploy):
  ```bash
  curl -H "Authorization: Bearer <CRON_SECRET>" \
       "https://<dein-projekt>.vercel.app/api/scrape-trigger?limit=2"
  ```
  (`?limit=2` begrenzt jede Quelle auf 2 Jobs – praktisch für einen
  schnellen Testlauf.)
- **Plan-Limits beachten**: Auf dem Vercel-Hobby-Plan können Cron-Jobs nur
  einmal pro Tag ausgeführt werden und Funktionen haben ein
  Ausführungslimit (Standard 10s, mit `maxDuration` in der Route bis zu
  60s auf Hobby / mehr auf Pro). `route.ts` setzt bereits
  `export const maxDuration = 60`. Falls die fünf Scraper insgesamt länger
  brauchen (insb. Joborama mit mehreren Kategorie-Seiten), ggf. auf den
  Pro-Plan wechseln oder den Endpoint pro Quelle aufteilen
  (`?source=jobsimsport` o.ä. – aktuell noch nicht implementiert).

### 5. Nach dem ersten Deploy

- Den Cron-Endpoint einmal manuell aufrufen (siehe oben), um zu prüfen,
  dass Jobs in die `jobs`-Tabelle geschrieben werden (Startseite/`/jobs`
  zeigen sonst „Noch keine Stellenangebote vorhanden“).
- Magic-Link-Login unter `/login` testen – dafür müssen Site URL und
  Redirect URLs in Supabase auf die Vercel-Domain gesetzt sein (siehe
  Abschnitt „Auth“ und Schritt 3 oben).

## Build & Checks

```bash
npm run lint
npm run build
npx tsc --noEmit
```

Status: `npm run build` und `npx tsc --noEmit` laufen aktuell fehlerfrei
durch.

### Hinweis zum Scraper-Test in Entwicklungs-Sandboxes

`npm run scrape:dry` kann in manchen Sandbox-/CI-Umgebungen mit
`Fehler: fetch failed` (DNS-Auflösung schlägt fehl, `EAI_AGAIN`)
scheitern, weil ausgehende Verbindungen dort blockiert bzw. nur über einen
Proxy erlaubt sind, den Node's `fetch` nicht automatisch nutzt. Das ist eine
Umgebungseinschränkung, kein Code-Fehler – auf einem normalen Rechner oder
in der Vercel-Produktionsumgebung funktioniert `fetch()` ohne weitere
Konfiguration. Vor dem produktiven Einsatz sollte `npm run scrape:dry`
einmal lokal (mit normalem Internetzugang) ausgeführt werden, um die
Selektoren der heuristischen Scraper (SPOBIS Jobs, Joborama) zu verifizieren.
