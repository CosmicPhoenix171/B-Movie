/* B-Movie Ratings App Logic */
(function(){
  const LS_KEY = 'bmovie:data:v2';
  const CATEGORIES = [
    { key:'overacting', label:'Overacting Award' },
    { key:'explosive', label:'Explosive Excellence' },
    { key:'plot', label:'Plot Confusion' },
    { key:'creature', label:'Creature Quality' },
    { key:'dialogue', label:'Dialogue Disaster' }
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
    dialogMovieTitle: document.getElementById('dialogMovieTitle')
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
    const yearVal = dom.year.value.trim();
    const year = yearVal ? parseInt(yearVal,10) : undefined;
    const notes = sanitize(dom.notes.value.trim());

    const dup = state.movies.find(m => m.title.toLowerCase() === title.toLowerCase() && (m.year||'') === (year||''));
    if(dup){
      flashField(dom.title, 'Movie already exists');
      return;
    }

    const movie = { id: crypto.randomUUID(), title, year, notes, addedAt: Date.now(), ratings: {} };
    state.movies.push(movie);
    persist();
    renderMovie(movie, true);
    dom.addForm.reset();
    dom.title.focus();
    applyFilters();
  });

  dom.sort?.addEventListener('change', applyFilters);
  dom.search?.addEventListener('input', applyFilters);

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
        alert('All categories must be scored 1–10.');
        return;
      }
      entry[cat.key] = val;
    }

    movie.ratings[username] = entry;
    persist();
    updateMovieCard(movie.id);
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

  function persist(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  function sanitize(str){ return str.replace(/[<>]/g,''); }
  function flashField(el,msg){ el.classList.add('error'); el.setAttribute('title',msg); setTimeout(()=>{ el.classList.remove('error'); el.removeAttribute('title'); },1600); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function renderAll(){
    dom.moviesList.innerHTML = '';
    state.movies.forEach(m => renderMovie(m));
    applyFilters();
  }

  function renderMovie(movie, prepend=false){
    const clone = dom.template.content.firstElementChild.cloneNode(true);
    clone.dataset.id = movie.id;
    clone.querySelector('.movie-title').textContent = movie.title;
    clone.querySelector('.year').textContent = movie.year || '';
    clone.querySelector('.notes').textContent = movie.notes || '';

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

    clone.querySelector('.open-rate').addEventListener('click', () => openDialog(movie));
    clone.querySelector('.delete-btn').addEventListener('click', () => {
      if(!confirm('Delete this movie?')) return;
      state.movies = state.movies.filter(m => m.id !== movie.id);
      persist();
      clone.remove();
      applyFilters();
    });

    updateCardScores(movie, clone);

    if(prepend) dom.moviesList.prepend(clone); else dom.moviesList.appendChild(clone);
  }

  function updateMovieCard(id){
    const movie = state.movies.find(m => m.id === id);
    if(!movie) return;
    const card = dom.moviesList.querySelector(`.movie-card[data-id="${id}"]`);
    if(card) updateCardScores(movie, card);
  }

  function updateCardScores(movie, card){
    const aggregates = getAggregates(movie);
    // per category avg
    for(const cat of CATEGORIES){
      const badge = card.querySelector(`.cat-badge[data-cat="${cat.key}"]`);
      const avg = aggregates.categoryAverages[cat.key];
      badge.textContent = `${shortLabel(cat.label)}: ${Number.isFinite(avg)? avg.toFixed(1):'–'}`;
      badge.dataset.empty = Number.isFinite(avg)?'false':'true';
    }
    card.querySelector('.total-val').textContent = aggregates.totalAllRaters;
    card.querySelector('.rater-count').textContent = aggregates.raterCount ? `(${aggregates.raterCount} rater${aggregates.raterCount===1?'':'s'})` : '';
  }

  function getAggregates(movie){
    const userEntries = Object.values(movie.ratings || {});
    const raterCount = userEntries.length;
    const sums = {}; CATEGORIES.forEach(c=> sums[c.key]=0);
    userEntries.forEach(entry => {
      CATEGORIES.forEach(c => { const v = Number(entry[c.key]); if(!isNaN(v)) sums[c.key]+=v; });
    });
    const categoryAverages = {};
    CATEGORIES.forEach(c => { categoryAverages[c.key] = raterCount ? sums[c.key]/raterCount : NaN; });
    // total per rater (sum of 5 categories) aggregated across raters
    const totalAllRaters = userEntries.reduce((acc,entry)=> acc + CATEGORIES.reduce((s,c)=> s + (Number(entry[c.key])||0),0), 0);
    return { raterCount, categoryAverages, totalAllRaters };
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
})();
