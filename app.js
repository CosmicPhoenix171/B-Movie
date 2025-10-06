/* B-Movie Ratings App Logic (with optional Firebase Firestore sync) */
(async function(){
  const LS_KEY = 'bmovie:data:v2';
  const CATEGORIES = [
    { key:'overacting', label:'Overacting Award' },
    { key:'explosive', label:'Over the Top Effects' },
    { key:'plot', label:'Plot Confusion' },
    { key:'creature', label:'Creature/Monster Quality' },
    { key:'dialogue', label:'Dialogue Disaster' }
  ];
  
  const BONUS_CATEGORIES = [
    { key:'enjoyment', label:'Enjoyment' }
  ];

  /** Data shape v2
   * {
   *   movies: [{
   *     id,title,year,notes,addedAt,
   *     ratings: { username: { overacting:number, explosive:number, plot:number, creature:number, dialogue:number } }
   *   }]
   * }
   */
  let state = loadState();

  const dom = {
    addForm: document.getElementById('addMovieForm'),
    title: document.getElementById('movieTitle'),
    year: document.getElementById('movieYear'),
    notes: document.getElementById('movieNotes'),
    username: document.getElementById('username'),
    moviesList: document.getElementById('moviesList'),
    template: document.getElementById('movieCardTemplate'),
    sort: document.getElementById('sortSelect'),
    search: document.getElementById('searchBox'),
    rateDialog: document.getElementById('rateDialog'),
    rateForm: document.getElementById('rateForm'),
    dialogMovieTitle: document.getElementById('dialogMovieTitle'),
    syncStatus: document.getElementById('syncStatus'),
    winnerForm: document.getElementById('winnerForm'),
    winnerMovie: document.getElementById('winnerMovie'),
    winnerPerson: document.getElementById('winnerPerson'),

    winnerDisplay: document.getElementById('winnerDisplay'),
    clearWinner: document.getElementById('clearWinner'),
    clearDisplayedWinner: document.getElementById('clearDisplayedWinner'),
    editTheme: document.getElementById('editTheme'),
    saveTheme: document.getElementById('saveTheme'),
    scoreTracker: document.getElementById('scoreTracker'),
    trackerScores: document.getElementById('trackerScores')
  };

  let activeMovieId = null; // used for dialog context

  dom.username.value = sessionStorage.getItem('bmovie:username') || '';
  dom.username.addEventListener('input', () => {
    sessionStorage.setItem('bmovie:username', dom.username.value.trim());
    refreshVisibleRatings();
  });

  dom.addForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = sanitize(dom.title.value.trim());
    if(!title) return;
    
    // Get current username for chooser
    const currentUser = dom.username.value.trim();
    if(!currentUser){
      alert('Please enter your name first (top right corner).');
      dom.username.focus();
      return;
    }
    
    const yearVal = dom.year.value.trim();
    const year = yearVal ? parseInt(yearVal,10) : undefined;
    const notes = sanitize(dom.notes.value.trim());

    const dup = state.movies.find(m => m.title.toLowerCase() === title.toLowerCase() && (m.year||'') === (year||''));
    if(dup){
      flashField(dom.title, 'Movie already exists');
      return;
    }

    const movie = {
      id: Math.random().toString(36).substr(2,9),
      title: dom.title.value.trim(),
      year: parseInt(dom.year.value,10) || null,
      chooser: currentUser,
      notes: dom.notes.value.trim(),
      addedAt: Date.now(),
      ratings: {}
    };
  state.movies.push(movie);
  persist(); // local + remote (if enabled)
  renderMovie(movie, true); // optimistic
    updateScoreTracker();
    dom.addForm.reset();
    dom.title.focus();
    applyFilters();
  });

  dom.sort?.addEventListener('change', applyFilters);
  dom.search?.addEventListener('input', applyFilters);
  
  // Winner panel events
  console.log('Winner form element:', dom.winnerForm);
  if(!dom.winnerForm) {
    console.error('Winner form not found!');
  }
  
  dom.winnerForm?.addEventListener('submit', e => {
    e.preventDefault();
    console.log('Winner form submitted');
    const movieId = dom.winnerMovie.value;
    const personName = dom.winnerPerson.value;
    console.log('Selected movie ID:', movieId, 'Selected person:', personName);
    
    if(!movieId || !personName){
      alert('Please select both a movie and a person.');
      return;
    }
    
    console.log('Calling setWinner...');
    setWinner(movieId, personName);
  });
  
  dom.clearWinner?.addEventListener('click', clearWinner);
  dom.clearDisplayedWinner?.addEventListener('click', clearWinner);
  
  // Backup: Direct click event on Crown Winner button
  const crownButton = document.querySelector('#winnerForm button[type="submit"]');
  console.log('Crown Winner button found:', crownButton);
  crownButton?.addEventListener('click', (e) => {
    console.log('Crown Winner button clicked directly');
    
    // If form submission isn't working, handle it manually
    const movieId = dom.winnerMovie.value;
    const personName = dom.winnerPerson.value;
    console.log('Manual check - Movie ID:', movieId, 'Person:', personName);
    
    if(movieId && personName) {
      console.log('Manual crown winner triggered');
      e.preventDefault();
      setWinner(movieId, personName);
    }
  });
  
  // Theme editing after winner is declared
  dom.saveTheme?.addEventListener('click', () => {
    if(!currentWinner) return;
    const newTheme = dom.editTheme.value.trim();
    currentWinner.nextTheme = newTheme || null;
    
    // Update the display immediately
    const themeEl = dom.winnerDisplay.querySelector('.winner-theme');
    if(currentWinner.nextTheme){
      themeEl.textContent = `Next Theme: ${currentWinner.nextTheme}`;
      themeEl.title = 'Click to edit theme';
      themeEl.style.display = 'block';
      
      // Make theme clickable to edit
      themeEl.onclick = () => {
        const themeEditor = dom.winnerDisplay.querySelector('.winner-theme-editor');
        if(themeEditor) {
          themeEditor.style.display = 'block';
          dom.editTheme.focus();
        }
      };
    } else {
      themeEl.style.display = 'none';
      themeEl.onclick = null;
    }
    
    // Hide theme editor after saving
    const themeEditor = dom.winnerDisplay.querySelector('.winner-theme-editor');
    if(themeEditor) {
      themeEditor.style.display = 'none';
    }
    
    // Save to localStorage
    localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
    console.log('Theme saved:', currentWinner.nextTheme);
    
    // Save to Firebase if enabled
    if(remote.enabled && firestore){
      saveWinnerToFirebase(currentWinner);
    }
  });
  
  // Allow Enter key to save theme
  dom.editTheme?.addEventListener('keypress', (e) => {
    if(e.key === 'Enter'){
      dom.saveTheme?.click();
    }
  });

  // Rating dialog events
  dom.rateForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = dom.username.value.trim();
    if(!username){
      alert('Enter your name first.');
      dom.username.focus();
      return;
    }
    if(!activeMovieId) return;
    const movie = state.movies.find(m => m.id === activeMovieId);
    if(!movie) return;

    const entry = {};
    for(const cat of CATEGORIES){
      const val = parseInt(dom.rateForm.elements[cat.key].value,10);
      if(isNaN(val) || val < 1 || val > 10){
        alert('All main categories must be scored 1–10.');
        return;
      }
      entry[cat.key] = val;
    }
    
    // Handle bonus categories (optional)
    for(const cat of BONUS_CATEGORIES){
      const val = parseInt(dom.rateForm.elements[cat.key].value,10);
      if(!isNaN(val) && val >= 1 && val <= 10){
        entry[cat.key] = val;
      }
    }

  movie.ratings[username] = entry;
  persist(); // local + remote (if enabled)
  updateMovieCard(movie.id); // optimistic UI; remote listener will reconcile if needed
    updateScoreTracker();
    closeDialog();
  });

  dom.rateForm.addEventListener('reset', () => {
    closeDialog();
  });

  function openDialog(movie){
    activeMovieId = movie.id;
    dom.dialogMovieTitle.textContent = movie.title;
    const username = dom.username.value.trim();
    const prior = username ? movie.ratings[username] : null;
    for(const cat of CATEGORIES){
      dom.rateForm.elements[cat.key].value = prior ? prior[cat.key] : '';
    }
    for(const cat of BONUS_CATEGORIES){
      dom.rateForm.elements[cat.key].value = prior ? prior[cat.key] : '';
    }
    if(typeof dom.rateDialog.showModal === 'function'){
      dom.rateDialog.showModal();
    } else {
      dom.rateDialog.setAttribute('open','true');
    }
  }
  function closeDialog(){
    activeMovieId = null;
    dom.rateDialog.close?.();
    dom.rateDialog.removeAttribute('open');
    dom.rateForm.reset();
  }

  // Load / migrate
  function loadState(){
    // Try v2
    try {
      const raw = localStorage.getItem(LS_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(parsed.movies) return parsed;
      }
    } catch {}

    // Migrate from v1 (if exists)
    try {
      const v1raw = localStorage.getItem('bmovie:data:v1');
      if(v1raw){
        const v1 = JSON.parse(v1raw);
        if(v1.movies){
          // Convert ratings (username:number) => username:{ each category = that star rating }
          v1.movies.forEach(m => {
            const newRatings = {};
            Object.entries(m.ratings || {}).forEach(([user,val]) => {
              const num = Number(val) || 0;
              newRatings[user] = {
                overacting: clamp(num * 2,1,10), // quick heuristic
                explosive: clamp(num * 2,1,10),
                plot: clamp(11 - num * 2,1,10), // inverted fun
                creature: clamp(num * 2,1,10),
              dialogue: clamp(num * 2,1,10)
              };
            });
            m.ratings = newRatings;
          });
          const migrated = { movies: v1.movies };
          localStorage.setItem(LS_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch {}

    return { movies: [] };
  }

  // --- Persistence Layer (local + optional Firestore) ---
  let remote = { enabled:false };
  let firestore = null;
  let moviesCollection = null;
  let unsubscribeMovies = null;
  
  // Winner state
  let currentWinner = null;

  function updateSyncStatus(mode,label){
    if(!dom.syncStatus) return;
    dom.syncStatus.dataset.mode = mode;
    dom.syncStatus.textContent = label;
  }

  async function initFirebase(){
    if(!window.FIREBASE_ENABLED || !window.FIREBASE_CONFIG) return; // feature flag & config presence
    try {
      updateSyncStatus('connecting','Connecting…');
      const [{ initializeApp }, { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js')
      ]);
      const app = initializeApp(window.FIREBASE_CONFIG);
      firestore = getFirestore(app);
      moviesCollection = collection(firestore, 'bmovie_movies');
      remote = { enabled:true, doc, setDoc, deleteDoc, onSnapshot, getDoc, collection };
      document.getElementById('storageModeNote')?.replaceChildren(document.createTextNode('Shared mode: Live synced via Firestore.'));
      updateSyncStatus('remote','Live Sync');
      attachRemoteListener();
      attachWinnerListener();
      loadRemoteWinner(); // Load existing winner on connect

      // Optional analytics (only if measurementId provided)
      if(window.FIREBASE_CONFIG.measurementId){
        try {
          const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js');
          getAnalytics(app); // no need to store; side-effect init
        } catch(aErr){
          console.warn('[Firebase] analytics init failed (ignored)', aErr);
        }
      }
    } catch(err){
      console.warn('[Firebase] init failed – falling back to local only.', err);
      remote.enabled = false;
      updateSyncStatus('error','Local (Init Failed)');
    }
  }

  function sanitizeForFirestore(movie){
    const { id, title, year=null, notes='', addedAt, ratings={}, chooser } = movie;
    return { id, title, year, notes, addedAt, ratings, chooser };
  }

  function attachRemoteListener(){
    if(!remote.enabled || !moviesCollection) return;
    if(unsubscribeMovies) unsubscribeMovies();
    unsubscribeMovies = remote.onSnapshot(moviesCollection, snapshot => {
      const remoteMovies = [];
      snapshot.forEach(d => { const data = d.data(); if(data && data.id) remoteMovies.push(data); });
      mergeRemoteState(remoteMovies);
    }, err => console.warn('[Firebase] listener error', err));
  }

  function mergeRemoteState(remoteMovies){
    const map = new Map(state.movies.map(m => [m.id, m]));
    remoteMovies.forEach(r => {
      map.set(r.id, { ...map.get(r.id), ...r });
    });
    state.movies = Array.from(map.values()).sort((a,b)=> b.addedAt - a.addedAt);
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    renderAll();
  }

  function removeUserRating(movieId, uname){
    const movie = state.movies.find(m => m.id === movieId);
    if(!movie || !movie.ratings) return;
    if(!movie.ratings[uname]) return;
    delete movie.ratings[uname];
    persist();
    updateMovieCard(movieId);
    updateScoreTracker();
  }

  // Winner functions
  function updateWinnerDropdowns(){
    if(!dom.winnerMovie || !dom.winnerPerson) return;
    
    // Clear existing options (keep first placeholder)
    dom.winnerMovie.innerHTML = '<option value="">Select movie...</option>';
    dom.winnerPerson.innerHTML = '<option value="">Select person...</option>';
    
    // Populate movies
    state.movies.forEach(movie => {
      const option = document.createElement('option');
      option.value = movie.id;
      option.textContent = `${movie.title} (${movie.year || 'Unknown'})`;
      dom.winnerMovie.appendChild(option);
    });
    
    // Collect all unique raters
    const allRaters = new Set();
    state.movies.forEach(movie => {
      if(movie.ratings){
        Object.keys(movie.ratings).forEach(username => allRaters.add(username));
      }
    });
    
    // Populate raters
    Array.from(allRaters).sort().forEach(username => {
      const option = document.createElement('option');
      option.value = username;
      option.textContent = username;
      dom.winnerPerson.appendChild(option);
    });
  }
  
  function setWinner(movieId, personName){
    console.log('setWinner called with:', movieId, personName);
    const movie = state.movies.find(m => m.id === movieId);
    if(!movie) {
      console.error('Movie not found for ID:', movieId);
      return;
    }
    
    console.log('Found movie:', movie);
    currentWinner = {
      movieId,
      movieTitle: movie.title,
      movieYear: movie.year,
      personName,
      nextTheme: null,
      setAt: Date.now()
    };
    
    console.log('Created winner object:', currentWinner);
    displayWinner();
    
    // Store in localStorage
    localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
    console.log('Winner saved to localStorage');
    
    // Store in Firebase if enabled
    if(remote.enabled && firestore){
      saveWinnerToFirebase(currentWinner);
    }
  }
  
  function clearWinner(){
    currentWinner = null;
    dom.winnerDisplay.style.display = 'none';
    dom.winnerForm.style.display = 'block';
    dom.winnerForm.reset();
    if(dom.editTheme) dom.editTheme.value = '';
    localStorage.removeItem('bmovie:winner');
    
    // Clear from Firebase if enabled
    if(remote.enabled && firestore){
      clearWinnerFromFirebase();
    }
  }
  
  function displayWinner(){
    if(!currentWinner) return;
    
    const titleEl = dom.winnerDisplay.querySelector('.winner-title');
    const subtitleEl = dom.winnerDisplay.querySelector('.winner-subtitle');
    const themeEl = dom.winnerDisplay.querySelector('.winner-theme');
    const themeEditor = dom.winnerDisplay.querySelector('.winner-theme-editor');
    
    titleEl.textContent = `${currentWinner.movieTitle} (${currentWinner.movieYear || 'Unknown'})`;
    subtitleEl.textContent = `Champion: ${currentWinner.personName}`;
    
    if(currentWinner.nextTheme){
      themeEl.textContent = `Next Theme: ${currentWinner.nextTheme}`;
      themeEl.title = 'Click to edit theme';
      themeEl.style.display = 'block';
      
      // Make theme clickable to edit
      themeEl.onclick = () => {
        const themeEditor = dom.winnerDisplay.querySelector('.winner-theme-editor');
        if(themeEditor) {
          themeEditor.style.display = 'block';
          dom.editTheme.focus();
        }
      };
    } else {
      themeEl.style.display = 'none';
      themeEl.onclick = null;
    }
    
    // Show theme editor only if no theme is set yet
    if(dom.editTheme && themeEditor){
      dom.editTheme.value = currentWinner.nextTheme || '';
      // Only show editor if no theme is currently set
      if(!currentWinner.nextTheme) {
        themeEditor.style.display = 'block';
      } else {
        themeEditor.style.display = 'none';
      }
      console.log('Theme editor populated with:', currentWinner.nextTheme);
    }
    
    dom.winnerDisplay.style.display = 'block';
    dom.winnerForm.style.display = 'none';
  }
  
  function loadWinner(){
    try {
      const stored = localStorage.getItem('bmovie:winner');
      if(stored){
        currentWinner = JSON.parse(stored);
        console.log('Loaded winner with theme:', currentWinner);
        displayWinner();
      }
    } catch(e) {
      console.warn('Failed to load winner:', e);
    }
  }

  // Firebase winner functions
  async function saveWinnerToFirebase(winner){
    try {
      const { collection, doc, setDoc } = remote;
      const winnersCollection = collection(firestore, 'bmovie_winners');
      const winnerDoc = doc(winnersCollection, 'current');
      await setDoc(winnerDoc, {
        ...winner,
        updatedAt: Date.now()
      });
      console.log('[Firebase] Winner saved to Firestore:', winner);
    } catch(e) {
      console.warn('[Firebase] Failed to save winner:', e);
    }
  }

  async function clearWinnerFromFirebase(){
    try {
      const { collection, doc, deleteDoc } = remote;
      const winnersCollection = collection(firestore, 'bmovie_winners');
      const winnerDoc = doc(winnersCollection, 'current');
      await deleteDoc(winnerDoc);
      console.log('[Firebase] Winner cleared from Firestore');
    } catch(e) {
      console.warn('[Firebase] Failed to clear winner:', e);
    }
  }

  async function loadRemoteWinner(){
    if(!remote.enabled || !firestore) {
      console.log('[Firebase] Remote not enabled or firestore not ready');
      return;
    }
    
    try {
      const { collection, doc, getDoc } = remote;
      const winnersCollection = collection(firestore, 'bmovie_winners');
      const winnerDoc = doc(winnersCollection, 'current');
      console.log('[Firebase] Attempting to load winner document...');
      const docSnap = await getDoc(winnerDoc);
      
      if(docSnap.exists()){
        const remoteWinner = docSnap.data();
        console.log('[Firebase] Loading existing winner:', remoteWinner);
        
        // Always load remote winner on startup (don't check timestamps)
        currentWinner = remoteWinner;
        localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
        displayWinner();
        console.log('[Firebase] Winner loaded from remote');
      } else {
        console.log('[Firebase] No existing winner found in Firestore');
      }
    } catch(e) {
      console.warn('[Firebase] Failed to load remote winner:', e);
    }
  }

  function attachWinnerListener(){
    if(!remote.enabled || !firestore) {
      console.log('[Firebase] Cannot attach winner listener - remote not enabled');
      return;
    }
    
    try {
      const { collection, doc, onSnapshot } = remote;
      const winnersCollection = collection(firestore, 'bmovie_winners');
      const winnerDoc = doc(winnersCollection, 'current');
      
      console.log('[Firebase] Attaching winner listener...');
      const unsubscribe = onSnapshot(winnerDoc, (doc) => {
        console.log('[Firebase] Winner document changed, exists:', doc.exists());
        if(doc.exists()){
          const remoteWinner = doc.data();
          console.log('[Firebase] Winner updated from remote:', remoteWinner);
          
          // Always update on real-time changes (skip timestamp check for now)
          currentWinner = remoteWinner;
          localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
          displayWinner();
          console.log('[Firebase] Winner synced from remote listener');
        } else {
          // Winner was cleared remotely
          if(currentWinner) {
            console.log('[Firebase] Winner cleared remotely via listener');
            currentWinner = null;
            dom.winnerDisplay.style.display = 'none';
            dom.winnerForm.style.display = 'block';
            dom.winnerForm.reset();
            if(dom.editTheme) dom.editTheme.value = '';
            localStorage.removeItem('bmovie:winner');
          }
        }
      }, (error) => {
        console.error('[Firebase] Winner listener error:', error);
      });
      
      // Store unsubscribe function for cleanup
      window.unsubscribeWinner = unsubscribe;
      console.log('[Firebase] Winner listener attached successfully');
    } catch(e) {
      console.warn('[Firebase] Failed to attach winner listener:', e);
    }
  }

  // Score Tracker Functions
  function updateScoreTracker(){
    if(!dom.trackerScores) return;
    
    // Calculate scores for each movie chooser
    const chooserScores = {};
    
    state.movies.forEach(movie => {
      if(!movie.chooser) return;
      
      // Get total score for this movie (sum of all raters' totals)
      const aggregates = getAggregates(movie);
      if(aggregates.raterCount === 0) return;
      
      // Sum all raters' main category totals for this movie
      let movieTotalScore = 0;
      Object.values(movie.ratings || {}).forEach(userRating => {
        const userTotal = CATEGORIES.reduce((sum, cat) => {
          return sum + (Number(userRating[cat.key]) || 0);
        }, 0);
        movieTotalScore += userTotal;
      });
      
      // Add to chooser's total
      if(!chooserScores[movie.chooser]) {
        chooserScores[movie.chooser] = {
          totalScore: 0,
          movieCount: 0,
          avgScore: 0
        };
      }
      
      chooserScores[movie.chooser].totalScore += movieTotalScore;
      chooserScores[movie.chooser].movieCount += 1;
      chooserScores[movie.chooser].avgScore = Math.round(chooserScores[movie.chooser].totalScore / chooserScores[movie.chooser].movieCount);
    });
    
    // Convert to sorted array
    const sortedScores = Object.entries(chooserScores)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalScore - a.totalScore);
    
    // Render score tracker
    if(sortedScores.length === 0) {
      dom.trackerScores.innerHTML = '<span class="no-scores">Add movies to see scores</span>';
      return;
    }
    
    const topScore = sortedScores[0]?.totalScore || 0;
    dom.trackerScores.innerHTML = '';
    
    sortedScores.forEach((scorer, index) => {
      const scoreItem = document.createElement('div');
      scoreItem.className = `score-item-tracker ${scorer.totalScore === topScore && topScore > 0 ? 'top-scorer' : ''}`;
      scoreItem.innerHTML = `
        <span class="scorer-name">${sanitize(scorer.name)}</span>
        <span class="scorer-points">${scorer.totalScore}pts</span>
        <span class="scorer-avg">(${scorer.avgScore} avg)</span>
      `;
      scoreItem.title = `${scorer.name}: ${scorer.totalScore} total points from ${scorer.movieCount} movie(s), ${scorer.avgScore} average per movie`;
      dom.trackerScores.appendChild(scoreItem);
    });
  }

  function persist(){
    // Always save local for offline resilience
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    if(!remote.enabled || !moviesCollection) return;
    // Upsert each movie (simple approach; fine for small scale)
    state.movies.forEach(m => {
      // Ensure chooser field exists for existing movies
      if(!m.chooser) {
        m.chooser = currentUser;
      }
      remote.setDoc(remote.doc(moviesCollection, m.id), sanitizeForFirestore(m)).catch(e=>console.warn('[Firebase] write fail', e));
    });
  }
  // Force re-sync all movies to Firebase (call this in console if needed)
  function forceResyncMovies(){
    console.log('Force resyncing all movies to Firebase...');
    persist();
    updateScoreTracker();
    console.log('Resync complete!');
  }
  window.forceResyncMovies = forceResyncMovies; // Make available in console

  function sanitize(str){ return str.replace(/[<>]/g,''); }
  function flashField(el,msg){ el.classList.add('error'); el.setAttribute('title',msg); setTimeout(()=>{ el.classList.remove('error'); el.removeAttribute('title'); },1600); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function renderAll(){
    dom.moviesList.innerHTML = '';
    state.movies.forEach(m => renderMovie(m));
    updateWinnerDropdowns();
    updateScoreTracker();
    applyFilters();
  }

  function renderMovie(movie, prepend=false){
    const clone = dom.template.content.firstElementChild.cloneNode(true);
    clone.dataset.id = movie.id;
    clone.querySelector('.movie-title').textContent = movie.title;
    clone.querySelector('.year').textContent = movie.year || '';
    
    // Add chooser info if available
    const notesEl = clone.querySelector('.notes');
    let notesText = movie.notes || '';
    if(movie.chooser){
      notesText = `Chosen by: ${movie.chooser}${movie.notes ? ` • ${movie.notes}` : ''}`;
    }
    notesEl.textContent = notesText;

    // categories row container
    const catRow = clone.querySelector('.score-row.categories');
    for(const cat of CATEGORIES){
      const span = document.createElement('span');
      span.className = 'cat-badge';
      span.dataset.cat = cat.key;
      span.title = cat.label;
      span.textContent = `${shortLabel(cat.label)}: –`;
      catRow.appendChild(span);
    }
    
    // bonus categories (don't count toward total)
    for(const cat of BONUS_CATEGORIES){
      const span = document.createElement('span');
      span.className = 'cat-badge bonus';
      span.dataset.cat = cat.key;
      span.title = cat.label + ' (bonus - not counted in total)';
      span.textContent = `${shortLabel(cat.label)}: –`;
      catRow.appendChild(span);
    }

    clone.querySelector('.open-rate').addEventListener('click', () => openDialog(movie));
    clone.querySelector('.delete-btn').addEventListener('click', () => {
      if(!confirm('Delete this movie?')) return;
      state.movies = state.movies.filter(m => m.id !== movie.id);
      persist();
      if(remote.enabled && moviesCollection){
        remote.deleteDoc(remote.doc(moviesCollection, movie.id)).catch(e=>console.warn('[Firebase] delete fail', e));
      }
      clone.remove();
      applyFilters();
    });

    updateCardScores(movie, clone);
    updateIndividualReviews(movie, clone);

    if(prepend) dom.moviesList.prepend(clone); else dom.moviesList.appendChild(clone);
  }

  function updateMovieCard(id){
    const movie = state.movies.find(m => m.id === id);
    if(!movie) return;
    const card = dom.moviesList.querySelector(`.movie-card[data-id="${id}"]`);
    if(card) {
      updateCardScores(movie, card);
      updateIndividualReviews(movie, card);
    }
  }

  function updateCardScores(movie, card){
    const username = dom.username.value.trim();
    const userHasRated = !!(username && movie.ratings && movie.ratings[username]);
    const aggregates = getAggregates(movie);
    const raterCount = aggregates.raterCount;

    const lockNeeded = raterCount > 0 && !userHasRated; // hide others until user participates

    // Per-category averages (or masked)
    for(const cat of CATEGORIES){
      const badge = card.querySelector(`.cat-badge[data-cat="${cat.key}"]`);
      if(!badge) continue;
      if(lockNeeded){
        badge.textContent = `${shortLabel(cat.label)}: ?`;
        badge.dataset.empty = 'true';
        badge.dataset.locked = 'true';
      } else {
        const avg = aggregates.categoryAverages[cat.key];
        badge.textContent = `${shortLabel(cat.label)}: ${Number.isFinite(avg)? avg.toFixed(1):'–'}`;
        badge.dataset.empty = Number.isFinite(avg)?'false':'true';
        badge.dataset.locked = 'false';
      }
    }
    // Bonus categories (still shown only if user rated OR we could also hide — follow same rule)
    for(const cat of BONUS_CATEGORIES){
      const badge = card.querySelector(`.cat-badge[data-cat="${cat.key}"]`);
      if(!badge) continue;
      if(lockNeeded){
        badge.textContent = `${shortLabel(cat.label)}: ?`;
        badge.dataset.empty = 'true';
        badge.dataset.locked = 'true';
      } else {
        const avg = aggregates.bonusAverages[cat.key];
        badge.textContent = `${shortLabel(cat.label)}: ${Number.isFinite(avg)? avg.toFixed(1):'–'}`;
        badge.dataset.empty = Number.isFinite(avg)?'false':'true';
        badge.dataset.locked = 'false';
      }
    }

    // Total & rater count (masked if locked)
    const totalEl = card.querySelector('.total-val');
    const raterEl = card.querySelector('.rater-count');
    if(lockNeeded){
      totalEl.textContent = '?';
      raterEl.textContent = '(hidden)';
    } else {
      totalEl.textContent = aggregates.totalAllRaters;
      raterEl.textContent = raterCount ? `(${raterCount} rater${raterCount===1?'':'s'})` : '';
    }

    // Locked message handling
    const scoresWrap = card.querySelector('.scores-wrap');
    let lockMsg = scoresWrap.querySelector('.locked-msg');
    if(lockNeeded){
      if(!lockMsg){
        lockMsg = document.createElement('div');
        lockMsg.className = 'locked-msg';
        scoresWrap.appendChild(lockMsg);
      }
      lockMsg.innerHTML = 'Ratings hidden until <strong>you rate</strong> this movie.';
    } else if(lockMsg){
      lockMsg.remove();
    }
  }

  function updateIndividualReviews(movie, card){
    // Ensure the details section exists (older rendered cards before template change won't have it)
    let details = card.querySelector('.individual-reviews');
    if(!details){
      details = document.createElement('details');
      details.className = 'individual-reviews';
      const summary = document.createElement('summary');
      summary.className = 'reviews-toggle';
      summary.textContent = 'Individual Reviews';
      const list = document.createElement('div');
      list.className = 'reviews-list';
      details.appendChild(summary);
      details.appendChild(list);
      // Insert before footer if possible
      const footer = card.querySelector('.card-actions');
      card.insertBefore(details, footer || null);
    }

    const reviewsList = details.querySelector('.reviews-list');
    const reviewsToggle = details.querySelector('.reviews-toggle');
    if(!reviewsList || !reviewsToggle) return;

    reviewsList.innerHTML = '';
  const ratings = movie.ratings || {};
  const usernames = Object.keys(ratings);
  const username = dom.username.value.trim();
  const userHasRated = !!(username && ratings[username]);

    if(usernames.length === 0){
      reviewsList.innerHTML = '<p class="no-reviews">No reviews yet</p>';
      reviewsToggle.textContent = 'Individual Reviews';
      details.removeAttribute('open');
      return;
    }

    // If current user has not rated yet, hide the list content
    if(!userHasRated){
      reviewsToggle.textContent = `Individual Reviews (locked)`;
      reviewsList.innerHTML = '<p class="no-reviews">Rate this movie to reveal other reviewers.</p>';
      details.removeAttribute('open');
      return;
    }

    reviewsToggle.textContent = `Individual Reviews (${usernames.length})`;

    // Auto-open if there are ratings (but only first time / if not manually toggled)
    if(!details.hasAttribute('data-user-toggled')){
      details.setAttribute('open','');
    }

    usernames.forEach(username => {
      const userRating = ratings[username];
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'user-review';

      // Calculate user's total from main categories only
      const userTotal = CATEGORIES.reduce((sum, cat) => sum + (Number(userRating[cat.key]) || 0), 0);

      const isOwner = username === dom.username.value.trim();
      let headerHTML = `<div class="reviewer-header">\n        <strong class="reviewer-name">${sanitize(username)}</strong>\n        <span class="reviewer-total">Total: ${userTotal}</span>`;
      if(isOwner){
        headerHTML += ` <button type="button" class="del-rating-btn" data-user="${sanitize(username)}" title="Delete your rating">✖</button>`;
      }
      headerHTML += `\n      </div>`;

      let reviewHTML = headerHTML + `\n      <div class="reviewer-scores">`;

      // Main categories
      CATEGORIES.forEach(cat => {
        const score = userRating[cat.key];
        if(score !== undefined && score !== null){
          reviewHTML += `<span class="score-item">${shortLabel(cat.label)}: ${score}</span>`;
        }
      });

      // Bonus categories
      BONUS_CATEGORIES.forEach(cat => {
        const score = userRating[cat.key];
        if(score !== undefined && score !== null){
          reviewHTML += `<span class="score-item bonus">${shortLabel(cat.label)}: ${score}</span>`;
        }
      });

      reviewHTML += '</div>';
      reviewDiv.innerHTML = reviewHTML;
      if(isOwner){
        const btn = reviewDiv.querySelector('.del-rating-btn');
        btn?.addEventListener('click', () => {
          if(confirm('Delete your rating for this movie?')){
            removeUserRating(movie.id, username);
          }
        });
      }
      reviewsList.appendChild(reviewDiv);
    });

    // Track manual toggle so we don't force open after user closed it
    details.addEventListener('toggle', () => {
      details.setAttribute('data-user-toggled','true');
    }, { once: true });
  }

  function getAggregates(movie){
    const userEntries = Object.values(movie.ratings || {});
    const raterCount = userEntries.length;
    
    // Regular categories (count toward total)
    const sums = {}; CATEGORIES.forEach(c=> sums[c.key]=0);
    userEntries.forEach(entry => {
      CATEGORIES.forEach(c => { const v = Number(entry[c.key]); if(!isNaN(v)) sums[c.key]+=v; });
    });
    const categoryAverages = {};
    CATEGORIES.forEach(c => { categoryAverages[c.key] = raterCount ? sums[c.key]/raterCount : NaN; });
    
    // Bonus categories (don't count toward total)
    const bonusSums = {}; BONUS_CATEGORIES.forEach(c=> bonusSums[c.key]=0);
    userEntries.forEach(entry => {
      BONUS_CATEGORIES.forEach(c => { const v = Number(entry[c.key]); if(!isNaN(v)) bonusSums[c.key]+=v; });
    });
    const bonusAverages = {};
    BONUS_CATEGORIES.forEach(c => { bonusAverages[c.key] = raterCount ? bonusSums[c.key]/raterCount : NaN; });
    
    // total per rater (sum of main categories only) aggregated across raters
    const totalAllRaters = userEntries.reduce((acc,entry)=> acc + CATEGORIES.reduce((s,c)=> s + (Number(entry[c.key])||0),0), 0);
    return { raterCount, categoryAverages, bonusAverages, totalAllRaters };
  }

  function shortLabel(label){
    return label.split(/\s+/)[0].replace(/[^A-Za-z]/g,'').slice(0,8); // first word trimmed
  }

  function refreshVisibleRatings(){
    state.movies.forEach(m => updateMovieCard(m.id));
  }

  function applyFilters(){
    const sortMode = dom.sort.value;
    const q = dom.search.value.trim().toLowerCase();
    let arr = [...state.movies];

    if(q){
      arr = arr.filter(m => m.title.toLowerCase().includes(q) || (m.notes||'').toLowerCase().includes(q));
    }

    switch(sortMode){
      case 'title-asc': arr.sort((a,b)=> a.title.localeCompare(b.title)); break;
      case 'ratings-count-desc': arr.sort((a,b)=> getAggregates(b).raterCount - getAggregates(a).raterCount); break;
      case 'total-desc': arr.sort((a,b)=> getAggregates(b).totalAllRaters - getAggregates(a).totalAllRaters); break;
      case 'added-desc':
      default: arr.sort((a,b)=> b.addedAt - a.addedAt); break;
    }

    const frag = document.createDocumentFragment();
    arr.forEach(m => {
      const card = dom.moviesList.querySelector(`.movie-card[data-id="${m.id}"]`);
      if(card) frag.appendChild(card);
    });
    dom.moviesList.innerHTML='';
    dom.moviesList.appendChild(frag);
    dom.moviesList.classList.toggle('no-results', arr.length === 0);
  }

  // Click outside dialog to close
  dom.rateDialog?.addEventListener('click', e => {
    const rect = dom.rateDialog.getBoundingClientRect();
    if(e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom){
      closeDialog();
    }
  });
  window.addEventListener('keydown', e => { if(e.key==='Escape' && activeMovieId){ closeDialog(); }});

  renderAll();
  updateWinnerDropdowns();
  loadWinner();
  await initFirebase();
  if(!remote.enabled){
    updateSyncStatus('local','Local Only');
    debugLocalReason();
  }
  function debugLocalReason(){
    const reasons = [];
    if(typeof window.FIREBASE_ENABLED === 'undefined') reasons.push('window.FIREBASE_ENABLED undefined (config file not loaded?)');
    else if(!window.FIREBASE_ENABLED) reasons.push('FIREBASE_ENABLED is false');
    if(typeof window.FIREBASE_CONFIG === 'undefined') reasons.push('FIREBASE_CONFIG missing');
    else {
      if(!window.FIREBASE_CONFIG.projectId) reasons.push('FIREBASE_CONFIG.projectId missing');
    }
    if(reasons.length===0) reasons.push('Firebase init likely failed before enabling remote (see earlier console warnings).');
    console.info('[B-Movie][Sync Debug] Remote disabled reasons:', reasons.join('; '));
    console.info('[B-Movie][Sync Debug] FIREBASE_ENABLED=', window.FIREBASE_ENABLED, 'FIREBASE_CONFIG=', window.FIREBASE_CONFIG);
    console.info('[B-Movie][Sync Debug] To enable: ensure firebase-config.js is in same folder & referenced before app.js, set window.FIREBASE_ENABLED=true.');
  }
})();
