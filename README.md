# B-Movie

# B‑Movie Ratings

A lightweight, client‑side web app for you and a friend (or group) to catalog and rate gloriously dubious B‑movies.

No backend; everything is stored locally in your browser (`localStorage`). Share by sending the three core files (`index.html`, `styles.css`, `app.js`). Each person’s ratings are tied to the name they enter. Copies are not synced live.

## Features
- Add movies with title, year, notes
- Multi‑category scoring (1–10) across 5 award categories
- Automatic totals + per‑category averages
- Sort: Recently Added, Title, Highest Total Score, Most Raters
- Search filter (title + notes)
- Duplicate protection (title + year)
- Delete movies
- Smooth migration from old single‑star version (if present)

## Official Double Feature Rules
### Movie Selection
- Each player secretly picks one B‑movie (the cheesier the better)
- Choices stay hidden until play time
- Qualifiers for a B‑movie:
  - Low budget
  - Questionable acting
  - Plot holes you could drive a Jeep through

### Viewing Protocol
- Watch both films start to finish — no skipping, no mercy
- Talking encouraged: roast dialogue, praise rubber monsters, spot budget hacks

### Scoring Categories (1–10 Each)
1. Overacting Award – Peak theatrical chaos
2. Explosive Excellence – How unnecessarily big were the effects?
3. Plot Confusion – Narrative coherence (less sense can mean more points!)
4. Creature/Monster Quality – Foam, CGI, animatronic ambition, sock puppet spirit
5. Dialogue Disaster – Best terrible line / script meltdown

Total per rater per movie = Sum of all 5 (max 50). Night totals add every rater’s category scores together.

### Awards & Winner
- After both films: compute each movie’s grand total (sum of all category scores from all raters)
- Higher total = Night’s Champion of Cheese
- Winner chooses the next B‑movie night theme

## Using the App
1. Enter your name (top bar) — required before rating.
2. Add a movie.
3. Click “Rate / Edit” to open the dialog and enter 1–10 for each category.
4. Change your name to simulate another participant’s ratings.
5. Sort or search to explore.
6. Delete if a movie was added by mistake.

## Data Model
```
movie = {
  id,
  title,
  year,
  notes,
  addedAt,
  ratings: {
    username: {
      overacting, explosive, plot, creature, dialogue
    }
  }
}
```
Stored under `localStorage['bmovie:data:v2']`.

### Migration
If a previous v1 single‑star dataset is found, it auto‑converts star ratings into category scores (simple heuristic) so nothing is lost.

## Reset / Clear Data
Open DevTools console:
```
localStorage.removeItem('bmovie:data:v2')
```
Reload page.

## Possible Enhancements
- Export / import JSON session
- Real-time shared backend (Supabase / Firebase)
- Poster lookup (OMDb API)
- Genre tags & advanced filters
- Variance / “Most Divisive” metric
- Print-friendly score sheet
- Light/Dark theme toggle
- Keyboard shortcuts (numbers to focus category, arrows to adjust)

## Accessibility Notes
- Dialog uses native `<dialog>` when supported; fallback attribute otherwise.
- Inputs labeled and constrained 1–10.
- Future improvement: replace numeric fields with sliders + live region summary.

Have fun crowning the Champion of Cheese! 🛸🧀