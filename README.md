# B-Movie

# B‑Movie Ratings

A lightweight web app for you and a friend (or group) to catalog and rate gloriously dubious B‑movies.

The app stores data locally for resilience and can also live sync through Firebase Firestore. Identity now uses Firebase Google sign-in, and older typed-name scores can be merged into a signed-in account from the merge dialog.

## Features
- Firebase Google sign-in for rating identity
- Legacy score merge with dropdown selection for old typed names
- Private pending movie choices saved per signed-in user on the local device
- Add movies with title, year, notes
- Multi-category scoring across the full Good-Bad Movie Index
- Automatic totals + per‑category averages
- Sort: Recently Added, Title, Highest Total Score, Most Raters
- Search filter (title + notes)
- Duplicate protection (title + year)
- Delete movies
- Live sync through Firebase Firestore when enabled

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
- Winner chooses the next B‑movie night theme and can add custom Rule 1, Rule 2, and Rule 3 for that winner's next round

## Using the App
1. Sign in with Google from the Account panel.
2. If you have older scores saved under a typed name, open Merge Old Scores and select that old name from the dropdown.
3. In Add, either add a movie directly or save it to your private pending choices list for later.
4. Use Add Movie on a pending choice when you are ready to move it into the shared movie list.
5. Click Rate to score each category.
6. If the same movie has more than one old score, choose which score to keep from the conflict dropdown before applying the merge.
7. Sort or search to explore.

## Data Model
```
movie = {
  id,
  title,
  year,
  notes,
  addedAt,
  chooserId,
  chooserName,
  ratings: {
    userKey: {
      overacting, explosions, action, practical, gore, cgi, plot, creature, dialogue, enjoyment
    }
  },
  ratingNames: {
    userKey: displayName
  }
}
```
New ratings are written under the signed-in Firebase user UID. Older legacy ratings may still exist under typed names until they are merged.

### Migration
If a previous v1 single‑star dataset is found, it auto‑converts star ratings into category scores (simple heuristic) so nothing is lost.

## Reset / Clear Data
Open DevTools console:
```
localStorage.removeItem('bmovie:data:v5')
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