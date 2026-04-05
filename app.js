/* B-Movie Ratings App Logic (with Firebase Firestore sync and Google sign-in) */
(async function(){
  const LS_KEY = 'bmovie:data:v5';
  const LS_KEY_V4 = 'bmovie:data:v4';
  const LS_KEY_V3 = 'bmovie:data:v3';
  const LS_KEY_V2 = 'bmovie:data:v2';
  const PENDING_CHOICES_PREFIX = 'bmovie:pending:v1:';

  const CATEGORIES = [
    {
      key: 'overacting',
      label: 'Overacting',
      icon: '🎭',
      question: 'How exaggerated and entertaining were the performances?',
      levels: [
        '-5 - Masterpiece-level restraint',
        '-4 - Excellent, grounded performance',
        '-3 - Strong and believable',
        '-2 - Solid, normal acting',
        '-1 - Slightly stiff but fine',
        '0 - None / Not applicable',
        '1 - A little cheesy',
        '2 - Clearly overdone',
        '3 - Big silly energy',
        '4 - Wildly overacted',
        '5 - Maximum unhinged cheese'
      ]
    },
    {
      key: 'explosions',
      label: 'Explosions & Destruction',
      icon: '💥',
      question: 'How fun was the large-scale chaos?',
      levels: [
        '-5 - Smart, perfectly used spectacle',
        '-4 - Great action craft',
        '-3 - Strong and effective',
        '-2 - Normal blockbuster stuff',
        '-1 - Slightly underwhelming',
        '0 - None / Not applicable',
        '1 - A little cheesy',
        '2 - Big dumb fun',
        '3 - Excessive for no reason',
        '4 - Ridiculous destruction',
        '5 - Maximum cheese chaos'
      ]
    },
    {
      key: 'action',
      label: 'Action',
      icon: '🎬',
      question: 'How entertaining were the fights, chases, and stunts?',
      levels: [
        '-5 - Masterpiece action filmmaking',
        '-4 - Excellent and exciting',
        '-3 - Strong action scenes',
        '-2 - Normal good action',
        '-1 - Slightly weak',
        '0 - None / Not applicable',
        '1 - A little cheesy',
        '2 - Silly and fun',
        '3 - Ridiculous stunts',
        '4 - Pure chaos',
        '5 - Maximum cheese action'
      ]
    },
    {
      key: 'practical',
      label: 'Practical Effects',
      icon: '🧟',
      question: 'How fun were the physical effects, props, and makeup?',
      levels: [
        '-5 - Masterpiece practical craft',
        '-4 - Excellent effects work',
        '-3 - Strong and convincing',
        '-2 - Normal solid effects',
        '-1 - A bit weak',
        '0 - None / Not applicable',
        '1 - Slightly cheesy',
        '2 - Obviously fake but fun',
        '3 - Silly rubbery effects',
        '4 - Wonderful cheap nonsense',
        '5 - Maximum cheese effects'
      ]
    },
    {
      key: 'gore',
      label: 'Gore',
      icon: '🩸',
      question: 'How entertaining was the blood and damage?',
      levels: [
        '-5 - Masterful effects gore',
        '-4 - Excellent and effective',
        '-3 - Strong horror craft',
        '-2 - Normal decent gore',
        '-1 - Slightly weak',
        '0 - None / Not applicable',
        '1 - Slightly cheesy',
        '2 - Over-the-top fun',
        '3 - Silly and excessive',
        '4 - Hilarious splatter',
        '5 - Maximum cheese gore'
      ]
    },
    {
      key: 'cgi',
      label: 'CGI Crimes',
      icon: '🧬',
      question: 'How funny or distracting was the digital work?',
      levels: [
        '-5 - Seamless, masterpiece CGI',
        '-4 - Excellent visual work',
        '-3 - Strong and polished',
        '-2 - Normal passable CGI',
        '-1 - Slightly rough',
        '0 - None / Not applicable',
        '1 - A little cheesy',
        '2 - Noticeably fake but fun',
        '3 - Video-game nonsense',
        '4 - Laughably broken',
        '5 - Maximum cheese CGI crime'
      ]
    },
    {
      key: 'plot',
      label: 'Plot Chaos',
      icon: '🧠',
      question: 'How entertaining was the nonsense?',
      levels: [
        '-5 - Masterpiece storytelling',
        '-4 - Excellent plot',
        '-3 - Strong and coherent',
        '-2 - Normal solid story',
        '-1 - Slightly messy',
        '0 - None / Not applicable',
        '1 - A little cheesy',
        '2 - Fun nonsense',
        '3 - Wildly disconnected',
        '4 - Hilariously broken',
        '5 - Maximum chaos cheese'
      ]
    },
    {
      key: 'creature',
      label: 'Creature',
      icon: '🦖',
      question: 'How fun was the monster?',
      levels: [
        '-5 - Masterpiece creature design',
        '-4 - Excellent monster work',
        '-3 - Strong design',
        '-2 - Normal decent creature',
        '-1 - Slightly weak',
        '0 - None / Not applicable',
        '1 - A little cheesy',
        '2 - Goofy but fun',
        '3 - Rubber suit greatness',
        '4 - Ridiculous and lovable',
        '5 - Maximum cheese monster'
      ]
    },
    {
      key: 'dialogue',
      label: 'Dialogue',
      icon: '🗣',
      question: 'How quotable was the writing?',
      levels: [
        '-5 - Masterpiece dialogue',
        '-4 - Excellent writing',
        '-3 - Strong lines',
        '-2 - Normal solid dialogue',
        '-1 - Slightly awkward',
        '0 - None / Not applicable',
        '1 - A little cheesy',
        '2 - Corny and fun',
        '3 - Very quotable cheese',
        '4 - Meme-worthy nonsense',
        '5 - Maximum cheese dialogue'
      ]
    },
    {
      key: 'enjoyment',
      label: 'Enjoyment',
      icon: '❤️',
      question: 'How much fun did you have?',
      levels: [
        '-5 - Masterpiece, loved every second',
        '-4 - Excellent time',
        '-3 - Very enjoyable',
        '-2 - Normal good watch',
        '-1 - Slightly underwhelming',
        '0 - None / Not applicable',
        '1 - A little cheesy fun',
        '2 - Entertaining cheese',
        '3 - Very fun bad movie',
        '4 - Loved the cheese',
        '5 - Peak cheese joy'
      ]
    }
  ];

  const BONUS_CATEGORIES = [];

  const TRASH_TIERS = [
    { min: -50, max: -41, label: 'Good Movie Tier 5', emoji: '🏆', color: '#7dd3fc' },
    { min: -40, max: -31, label: 'Good Movie Tier 4', emoji: '⭐', color: '#60a5fa' },
    { min: -30, max: -21, label: 'Good Movie Tier 3', emoji: '🎥', color: '#94a3b8' },
    { min: -20, max: -11, label: 'Good Movie Tier 2', emoji: '🎞️', color: '#a1a1aa' },
    { min: -10, max: -1, label: 'Good Movie Tier 1', emoji: '🙂', color: '#cbd5e1' },
    { min: 0, max: 0, label: 'Neutral Final Score', emoji: '😐', color: '#f87171' },
    { min: 1, max: 10, label: 'Cheesy Movie Tier 1', emoji: '🧀', color: '#d6b45d' },
    { min: 11, max: 20, label: 'Cheesy Movie Tier 2', emoji: '🧀🧀', color: '#f59e0b' },
    { min: 21, max: 30, label: 'Cheesy Movie Tier 3', emoji: '🎬', color: '#fb7185' },
    { min: 31, max: 40, label: 'Cheesy Movie Tier 4', emoji: '💎', color: '#c084fc' },
    { min: 41, max: 50, label: 'Cheesy Movie Tier 5', emoji: '👑', color: '#facc15' }
  ];

  const LEGACY_RULE_OPTIONS = {
    'rule-1': 'Rule 1 - Movie Selection',
    'rule-2': 'Rule 2 - Viewing Protocol',
    'rule-3': 'Rule 3 - Good-Bad Movie Index'
  };

  let state = loadState();
  let activeMovieId = null;
  let currentWinner = null;
  let pendingChoices = [];
  let currentUser = null;
  let currentUserProfile = null;
  let firestore = null;
  let moviesCollection = null;
  let unsubscribeMovies = null;
  let unsubscribeWinner = null;
  let unsubscribeUserProfile = null;
  let remote = { enabled: false };
  let authApi = {
    status: 'loading',
    disabledReason: '',
    enabled: false,
    instance: null,
    provider: null,
    signInWithPopup: null,
    signOut: null
  };
  let mergeState = {
    selectedAliases: []
  };

  const dom = {
    addForm: document.getElementById('addMovieForm'),
    savePendingMovie: document.getElementById('savePendingMovie'),
    title: document.getElementById('movieTitle'),
    year: document.getElementById('movieYear'),
    notes: document.getElementById('movieNotes'),
    pendingPanel: document.getElementById('pendingPanel'),
    pendingList: document.getElementById('pendingList'),
    pendingEmpty: document.getElementById('pendingEmpty'),
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
    winnerEditorDropdown: document.getElementById('winnerEditorDropdown'),
    editTheme: document.getElementById('editTheme'),
    editRule1: document.getElementById('editRule1'),
    editRule2: document.getElementById('editRule2'),
    editRule3: document.getElementById('editRule3'),
    saveTheme: document.getElementById('saveTheme'),
    scoreTracker: document.getElementById('scoreTracker'),
    trackerScores: document.getElementById('trackerScores'),
    categoryGrid: document.getElementById('categoryGrid'),
    authPanel: document.getElementById('authPanel'),
    authName: document.getElementById('authName'),
    authHint: document.getElementById('authHint'),
    authMeta: document.getElementById('authMeta'),
    authNameEditor: document.getElementById('authNameEditor'),
    authDisplayName: document.getElementById('authDisplayName'),
    saveDisplayName: document.getElementById('saveDisplayName'),
    googleSignIn: document.getElementById('googleSignIn'),
    signOutBtn: document.getElementById('signOutBtn'),
    openMerge: document.getElementById('openMerge'),
    mergeDialog: document.getElementById('mergeDialog'),
    mergeForm: document.getElementById('mergeForm'),
    mergeCandidateList: document.getElementById('mergeCandidateList'),
    mergeCandidateSelect: document.getElementById('mergeCandidateSelect'),
    addMergeCandidate: document.getElementById('addMergeCandidate'),
    selectedMergeAliases: document.getElementById('selectedMergeAliases'),
    mergeCandidateHint: document.getElementById('mergeCandidateHint'),
    mergePreview: document.getElementById('mergePreview'),
    mergeConflicts: document.getElementById('mergeConflicts'),
    closeMerge: document.getElementById('closeMerge'),
    applyMerge: document.getElementById('applyMerge')
  };

  function getTrashTier(score) {
    for (const tier of TRASH_TIERS) {
      if (score >= tier.min && score <= tier.max) return tier;
    }
    return TRASH_TIERS[0];
  }

  function sanitize(str){
    return String(str ?? '').replace(/[<>]/g, '');
  }

  function flashField(el, msg){
    if(!el) return;
    el.classList.add('error');
    el.setAttribute('title', msg);
    setTimeout(() => {
      el.classList.remove('error');
      el.removeAttribute('title');
    }, 1600);
  }

  function getCurrentUserKey(){
    return currentUser?.uid || '';
  }

  function getProfileStorageKey(uid){
    return `bmovie:user-profile:${uid}`;
  }

  function getDefaultCurrentUserName(){
    return sanitize(currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Google User');
  }

  function getCurrentUserName(){
    return sanitize(currentUserProfile?.displayName || getDefaultCurrentUserName());
  }

  function createId(){
    if(globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return Math.random().toString(36).slice(2, 11);
  }

  function getPendingChoicesStorageKey(uid){
    return `${PENDING_CHOICES_PREFIX}${uid}`;
  }

  function normalizePendingChoice(choice){
    const title = sanitize(choice?.title || '').trim();
    const notes = sanitize(choice?.notes || '').trim();
    const rawYear = choice?.year;
    const yearNumber = rawYear === null || rawYear === undefined || rawYear === '' ? null : parseInt(rawYear, 10);
    return {
      id: sanitize(choice?.id || createId()),
      title,
      year: Number.isFinite(yearNumber) ? yearNumber : null,
      notes,
      addedAt: Number(choice?.addedAt) || Date.now()
    };
  }

  function readPendingChoices(uid){
    if(!uid) return [];
    try {
      const raw = localStorage.getItem(getPendingChoicesStorageKey(uid));
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      if(!Array.isArray(parsed)) return [];
      return parsed
        .map(normalizePendingChoice)
        .filter(choice => choice.title)
        .sort((a, b) => b.addedAt - a.addedAt);
    } catch {
      return [];
    }
  }

  function savePendingChoices(){
    const uid = getCurrentUserKey();
    if(!uid) return;
    localStorage.setItem(getPendingChoicesStorageKey(uid), JSON.stringify(pendingChoices));
  }

  function updatePendingChoice(choiceId, updates){
    let changed = false;
    pendingChoices = pendingChoices.map(choice => {
      if(choice.id !== choiceId) return choice;
      changed = true;
      return normalizePendingChoice({ ...choice, ...updates, id: choice.id, addedAt: choice.addedAt });
    });
    if(changed) savePendingChoices();
    return changed;
  }

  function loadPendingChoices(){
    pendingChoices = currentUser ? readPendingChoices(currentUser.uid) : [];
  }

  function clearAddForm(){
    dom.addForm?.reset();
    dom.title?.focus();
  }

  function getMovieDraftFromForm(){
    const title = sanitize(dom.title?.value.trim() || '');
    const yearVal = dom.year?.value.trim() || '';
    const year = yearVal ? parseInt(yearVal, 10) : null;
    const notes = sanitize(dom.notes?.value.trim() || '');
    return {
      title,
      year: Number.isFinite(year) ? year : null,
      notes
    };
  }

  function findDuplicateMovie(title, year){
    return state.movies.find(movie => (
      movie.title.toLowerCase() === title.toLowerCase() &&
      (movie.year || null) === (year || null)
    ));
  }

  function findDuplicatePendingChoice(title, year, ignoreId = ''){
    return pendingChoices.find(choice => (
      choice.id !== ignoreId &&
      choice.title.toLowerCase() === title.toLowerCase() &&
      (choice.year || null) === (year || null)
    ));
  }

  function buildMovieRecord(draft){
    const chooserName = getCurrentUserName();
    return ensureMovieShape({
      id: createId(),
      title: draft.title,
      year: draft.year,
      chooser: chooserName,
      chooserId: getCurrentUserKey(),
      chooserName,
      notes: draft.notes,
      addedAt: Date.now(),
      ratings: {},
      ratingNames: {}
    });
  }

  function addMovieRecordFromDraft(draft){
    if(!requireSignedIn('Please sign in with Google before adding a movie.')) return false;
    if(!draft.title) return false;
    const duplicate = findDuplicateMovie(draft.title, draft.year);
    if(duplicate){
      flashField(dom.title, 'Movie already exists');
      return false;
    }

    const movie = buildMovieRecord(draft);
    state.movies.push(movie);
    persist();
    renderMovie(movie, true);
    updateScoreTracker();
    updateWinnerDropdowns();
    applyFilters();
    return true;
  }

  function renderPendingChoices(){
    if(!dom.pendingList || !dom.pendingEmpty || !dom.pendingPanel) return;

    dom.pendingList.innerHTML = '';

    if(!currentUser){
      dom.pendingEmpty.textContent = 'Sign in to save private movie choices ahead of time.';
      dom.pendingEmpty.hidden = false;
      return;
    }

    if(!pendingChoices.length){
      dom.pendingEmpty.textContent = 'No pending choices yet. Save one above to keep it private until you are ready to add it.';
      dom.pendingEmpty.hidden = false;
      return;
    }

    dom.pendingEmpty.hidden = true;
    pendingChoices.forEach(choice => {
      const card = document.createElement('article');
      card.className = 'pending-card';
      card.dataset.id = choice.id;

      const safeYear = choice.year || 'Unknown';
      const noteText = choice.notes || 'No notes yet';
      const notesClassName = choice.notes ? 'pending-notes' : 'pending-notes pending-notes-empty';

      card.innerHTML = `
        <div class="pending-card-head">
          <h4 class="pending-title">${choice.title}</h4>
          <span class="pending-year">${safeYear}</span>
        </div>
        <button type="button" class="pending-notes-button" data-action="edit-notes" data-id="${choice.id}" aria-label="Edit pending notes for ${choice.title}">
          <p class="${notesClassName}">${noteText}</p>
        </button>
        <div class="pending-notes-editor" data-editor-id="${choice.id}" hidden>
          <label class="pending-notes-label" for="pendingNotes-${choice.id}">Pending notes</label>
          <textarea id="pendingNotes-${choice.id}" class="pending-notes-input" rows="3" maxlength="300" placeholder="Add private notes for this pending choice">${choice.notes}</textarea>
          <div class="pending-notes-actions">
            <button type="button" class="btn primary small" data-action="save-notes" data-id="${choice.id}">Save Notes</button>
            <button type="button" class="btn ghost small" data-action="cancel-notes" data-id="${choice.id}">Cancel</button>
          </div>
        </div>
        <div class="pending-actions">
          <button type="button" class="btn primary small" data-action="add" data-id="${choice.id}">Add Movie</button>
          <button type="button" class="btn ghost small" data-action="remove" data-id="${choice.id}">Remove</button>
        </div>
      `;

      dom.pendingList.appendChild(card);
    });
  }

  function saveDraftToPending(){
    if(!requireSignedIn('Please sign in with Google before saving a private movie choice.')) return;

    const draft = getMovieDraftFromForm();
    if(!draft.title){
      flashField(dom.title, 'Enter a movie title first');
      return;
    }

    if(findDuplicatePendingChoice(draft.title, draft.year)){
      flashField(dom.title, 'Pending choice already saved');
      return;
    }

    pendingChoices = [
      normalizePendingChoice({ ...draft, id: createId(), addedAt: Date.now() }),
      ...pendingChoices
    ];
    savePendingChoices();
    renderPendingChoices();
    clearAddForm();
  }

  function promotePendingChoice(choiceId){
    if(!requireSignedIn('Please sign in with Google before adding a pending movie.')) return;
    const choice = pendingChoices.find(item => item.id === choiceId);
    if(!choice) return;

    const added = addMovieRecordFromDraft(choice);
    if(!added) return;

    pendingChoices = pendingChoices.filter(item => item.id !== choiceId);
    savePendingChoices();
    renderPendingChoices();
  }

  function removePendingChoice(choiceId){
    pendingChoices = pendingChoices.filter(item => item.id !== choiceId);
    savePendingChoices();
    renderPendingChoices();
  }

  function openPendingNotesEditor(choiceId){
    const card = dom.pendingList?.querySelector(`.pending-card[data-id="${choiceId}"]`);
    if(!card) return;

    const displayButton = card.querySelector('.pending-notes-button');
    const editor = card.querySelector(`.pending-notes-editor[data-editor-id="${choiceId}"]`);
    const input = card.querySelector('.pending-notes-input');
    if(!displayButton || !editor || !input) return;

    displayButton.hidden = true;
    editor.hidden = false;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function closePendingNotesEditor(choiceId){
    const card = dom.pendingList?.querySelector(`.pending-card[data-id="${choiceId}"]`);
    if(!card) return;

    const displayButton = card.querySelector('.pending-notes-button');
    const editor = card.querySelector(`.pending-notes-editor[data-editor-id="${choiceId}"]`);
    if(displayButton) displayButton.hidden = false;
    if(editor) editor.hidden = true;
  }

  function savePendingNotes(choiceId){
    const card = dom.pendingList?.querySelector(`.pending-card[data-id="${choiceId}"]`);
    const input = card?.querySelector('.pending-notes-input');
    if(!input) return;

    const notes = sanitize(input.value.trim());
    if(!updatePendingChoice(choiceId, { notes })) return;
    renderPendingChoices();
  }

  function normalizeWinnerRules(winner){
    if(!winner || typeof winner !== 'object') return ['', '', ''];
    if(Array.isArray(winner.nextRules)){
      return [0, 1, 2].map(index => sanitize(winner.nextRules[index] || ''));
    }
    if(winner.nextRuleId && LEGACY_RULE_OPTIONS[winner.nextRuleId]){
      return [LEGACY_RULE_OPTIONS[winner.nextRuleId], '', ''];
    }
    return ['', '', ''];
  }

  function getEditedWinnerRules(){
    return [
      sanitize(dom.editRule1?.value.trim() || ''),
      sanitize(dom.editRule2?.value.trim() || ''),
      sanitize(dom.editRule3?.value.trim() || '')
    ];
  }

  function ensureMovieShape(movie){
    movie.ratings = movie.ratings && typeof movie.ratings === 'object' ? movie.ratings : {};
    movie.ratingNames = movie.ratingNames && typeof movie.ratingNames === 'object' ? movie.ratingNames : {};
    if(movie.chooserName && !movie.chooser) movie.chooser = movie.chooserName;
    return movie;
  }

  function normalizeState(value){
    if(!value?.movies) return { movies: [] };
    value.movies.forEach(movie => {
      ensureMovieShape(movie);
      delete movie.legacySets;
      delete movie.legacyRatings;
    });
    return value;
  }

  function getRatingTotals(entry){
    let bMovieScore = 0;
    let mainstreamScore = 0;

    CATEGORIES.forEach(cat => {
      const score = Number(entry?.[cat.key]) || 0;
      if(score > 0) bMovieScore += score;
      if(score < 0) mainstreamScore += score;
    });

    const finalScore = bMovieScore + mainstreamScore;
    const pointsTotal = bMovieScore + Math.abs(mainstreamScore);
    const cheeseTotal = finalScore;

    return { bMovieScore, mainstreamScore, finalScore, pointsTotal, cheeseTotal };
  }

  function formatSignedScore(value){
    const numericValue = Math.abs(Number(value) || 0);
    if(numericValue > 0) return numericValue.toFixed(1).replace(/\.0$/, '');
    return '0';
  }

  function getKnownName(key){
    if(!key) return '';
    if(currentUser?.uid === key) return getCurrentUserName();
    if(currentWinner?.personKey === key && currentWinner.personName) return currentWinner.personName;
    for(const movie of state.movies){
      if(movie.ratingNames?.[key]) return sanitize(movie.ratingNames[key]);
      if(movie.chooserId === key && movie.chooserName) return sanitize(movie.chooserName);
    }
    return sanitize(key);
  }

  function getRatingLabel(movie, key){
    return sanitize(movie.ratingNames?.[key] || getKnownName(key));
  }

  function getChooserLabel(movie){
    return sanitize(movie.chooserName || movie.chooser || (movie.chooserId ? getKnownName(movie.chooserId) : ''));
  }

  function setAuthPanel(stateName, nameText, hintText, metaText){
    if(!dom.authPanel) return;
    dom.authPanel.dataset.state = stateName;
    dom.authName.textContent = nameText;
    dom.authHint.textContent = hintText;
    dom.authMeta.textContent = metaText || '';
    if(dom.authNameEditor) dom.authNameEditor.hidden = stateName !== 'signed-in';
    if(dom.authDisplayName && stateName === 'signed-in') dom.authDisplayName.value = getCurrentUserName();
    dom.googleSignIn.hidden = stateName === 'signed-in' || stateName === 'disabled';
    dom.signOutBtn.hidden = stateName !== 'signed-in';
    dom.openMerge.hidden = !(stateName === 'signed-in' && getLegacyMergeCandidates().length > 0);
  }

  function updateAuthPanel(){
    if(authApi.status === 'disabled'){
      setAuthPanel(
        'disabled',
        'Firebase unavailable',
        'Google sign-in is currently unavailable for this app.',
        authApi.disabledReason
      );
      return;
    }

    if(authApi.status === 'loading'){
      setAuthPanel(
        'loading',
        'Checking account...',
        'Connecting to Firebase Google sign-in.',
        ''
      );
      return;
    }

    if(currentUser){
      setAuthPanel(
        'signed-in',
        getCurrentUserName(),
        'Signed in with Google. You can change how your name appears in the app below.',
        sanitize(currentUser.email || '')
      );
      return;
    }

    setAuthPanel(
      'signed-out',
      'Not signed in',
      'Google sign-in is required before you can add movies or submit ratings.',
      'Browse is available, but creation and rating are locked.'
    );
  }

  function requireSignedIn(message){
    if(currentUser) return true;
    alert(message);
    menuToggle?.classList.add('active');
    mobileMenu?.classList.add('open');
    dom.googleSignIn?.focus();
    return false;
  }

  function humanizeAuthError(error){
    const code = error?.code || '';
    if(code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled before it finished.';
    if(code === 'auth/popup-blocked') return 'The browser blocked the Google sign-in popup. Allow popups and try again.';
    if(code === 'auth/unauthorized-domain') return 'This site is not listed in Firebase Authentication authorized domains.';
    if(code === 'auth/operation-not-allowed') return 'Google sign-in is not enabled in the Firebase Authentication console.';
    return error?.message || 'Google sign-in failed.';
  }

  async function handleGoogleSignIn(){
    if(!authApi.enabled || !authApi.signInWithPopup || !authApi.instance || !authApi.provider){
      alert('Firebase Google sign-in is not ready yet.');
      return;
    }

    dom.authMeta.textContent = 'Opening Google sign-in...';
    try {
      await authApi.signInWithPopup(authApi.instance, authApi.provider);
    } catch (error) {
      const message = humanizeAuthError(error);
      dom.authMeta.textContent = message;
      console.warn('[Firebase][Auth] sign-in failed', error);
      alert(message);
    }
  }

  async function handleSignOut(){
    if(!authApi.enabled || !authApi.signOut || !authApi.instance) return;
    try {
      await authApi.signOut(authApi.instance);
    } catch (error) {
      const message = humanizeAuthError(error);
      dom.authMeta.textContent = message;
      console.warn('[Firebase][Auth] sign-out failed', error);
      alert(message);
    }
  }

  function readStoredUserProfile(uid){
    try {
      const raw = localStorage.getItem(getProfileStorageKey(uid));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function storeUserProfile(uid, profile){
    try {
      localStorage.setItem(getProfileStorageKey(uid), JSON.stringify(profile));
    } catch {}
  }

  function getProfileUpdatedAt(profile){
    return Number(profile?.updatedAt) || 0;
  }

  function pickNewestProfile(primaryProfile, secondaryProfile){
    const primaryUpdatedAt = getProfileUpdatedAt(primaryProfile);
    const secondaryUpdatedAt = getProfileUpdatedAt(secondaryProfile);
    return primaryUpdatedAt >= secondaryUpdatedAt ? primaryProfile : secondaryProfile;
  }

  async function writeUserProfileToRemote(uid, profile){
    if(!remote.enabled || !firestore || !uid || !profile) return;
    const usersCollection = remote.collection(firestore, 'bmovie_users');
    const userDoc = remote.doc(usersCollection, uid);
    await remote.setDoc(userDoc, profile);
  }

  async function loadCurrentUserProfile(uid){
    const localProfile = readStoredUserProfile(uid);
    if(localProfile) currentUserProfile = localProfile;
    else currentUserProfile = {
      uid,
      displayName: getDefaultCurrentUserName(),
      email: currentUser?.email || '',
      updatedAt: 0
    };

    if(!remote.enabled || !firestore || !uid) return currentUserProfile;

    try {
      const usersCollection = remote.collection(firestore, 'bmovie_users');
      const userDoc = remote.doc(usersCollection, uid);
      const docSnap = await remote.getDoc(userDoc);
      const remoteProfile = docSnap.exists() ? docSnap.data() : null;

      if(remoteProfile || localProfile){
        currentUserProfile = {
          ...pickNewestProfile(localProfile || currentUserProfile, remoteProfile || currentUserProfile),
          uid,
          email: currentUser?.email || (remoteProfile?.email || localProfile?.email || '')
        };
      }

      storeUserProfile(uid, currentUserProfile);

      if(getProfileUpdatedAt(currentUserProfile) > getProfileUpdatedAt(remoteProfile)){
        await writeUserProfileToRemote(uid, currentUserProfile);
      }
    } catch (error) {
      console.warn('[Firebase] Failed to load user profile:', error);
    }

    return currentUserProfile;
  }

  async function saveCurrentUserProfile(displayName){
    const uid = getCurrentUserKey();
    if(!uid) return;
    currentUserProfile = {
      ...currentUserProfile,
      uid,
      displayName,
      email: currentUser?.email || '',
      updatedAt: Date.now()
    };
    storeUserProfile(uid, currentUserProfile);

    if(!remote.enabled || !firestore) return;

    try {
      await writeUserProfileToRemote(uid, currentUserProfile);
    } catch (error) {
      console.warn('[Firebase] Failed to save user profile:', error);
      throw error;
    }
  }

  function attachUserProfileListener(uid){
    if(!remote.enabled || !firestore || !uid) return;
    if(unsubscribeUserProfile) unsubscribeUserProfile();

    try {
      const usersCollection = remote.collection(firestore, 'bmovie_users');
      const userDoc = remote.doc(usersCollection, uid);
      unsubscribeUserProfile = remote.onSnapshot(
        userDoc,
        async docSnap => {
          if(!docSnap.exists()) return;

          const remoteProfile = docSnap.data();
          const activeProfile = currentUserProfile || readStoredUserProfile(uid) || {
            uid,
            displayName: getDefaultCurrentUserName(),
            email: currentUser?.email || '',
            updatedAt: 0
          };
          const activeUpdatedAt = getProfileUpdatedAt(activeProfile);
          const remoteUpdatedAt = getProfileUpdatedAt(remoteProfile);

          if(activeUpdatedAt > remoteUpdatedAt){
            await writeUserProfileToRemote(uid, activeProfile);
            return;
          }

          if(remoteUpdatedAt > activeUpdatedAt){
            currentUserProfile = {
              ...remoteProfile,
              uid,
              email: currentUser?.email || remoteProfile?.email || ''
            };
            storeUserProfile(uid, currentUserProfile);
            propagateCurrentUserName(getCurrentUserName());
            renderAll();
            if(currentWinner) displayWinner();
          }
        },
        error => console.warn('[Firebase] User profile listener error:', error)
      );
    } catch (error) {
      console.warn('[Firebase] Failed to attach user profile listener:', error);
    }
  }

  function propagateCurrentUserName(displayName){
    const uid = getCurrentUserKey();
    if(!uid) return;

    let moviesChanged = false;
    let winnerChanged = false;

    state.movies.forEach(movie => {
      ensureMovieShape(movie);
      if(movie.chooserId === uid && movie.chooserName !== displayName){
        movie.chooserName = displayName;
        movie.chooser = displayName;
        moviesChanged = true;
      }
      if(movie.ratings?.[uid] && movie.ratingNames?.[uid] !== displayName){
        movie.ratingNames[uid] = displayName;
        moviesChanged = true;
      }
    });

    if(currentWinner?.personKey === uid && currentWinner.personName !== displayName){
      currentWinner.personName = displayName;
      winnerChanged = true;
    }

    if(moviesChanged) persist();
    if(winnerChanged){
      localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
      if(remote.enabled && firestore) saveWinnerToFirebase(currentWinner);
    }
  }

  async function handleDisplayNameSave(){
    if(!requireSignedIn('Please sign in with Google before changing your username.')) return;

    const proposedName = sanitize(dom.authDisplayName?.value.trim() || '');
    if(!proposedName){
      alert('Enter a username first.');
      dom.authDisplayName?.focus();
      return;
    }

    if(proposedName === getCurrentUserName()){
      dom.authMeta.textContent = 'Username is already up to date.';
      return;
    }

    if(dom.authDisplayName) dom.authDisplayName.disabled = true;
    if(dom.saveDisplayName) dom.saveDisplayName.disabled = true;
    dom.authMeta.textContent = 'Saving username...';

    try {
      await saveCurrentUserProfile(proposedName);
      propagateCurrentUserName(proposedName);
      renderAll();
      if(currentWinner) displayWinner();
      dom.authMeta.textContent = `Username updated to ${proposedName}.`;
    } catch (error) {
      const message = error?.message || 'Could not save the username change.';
      dom.authMeta.textContent = message;
      alert(message);
    } finally {
      if(dom.authDisplayName) dom.authDisplayName.disabled = false;
      if(dom.saveDisplayName) dom.saveDisplayName.disabled = false;
    }
  }

  function isUidLikeKey(key){
    return /^[A-Za-z0-9_-]{25,}$/.test(String(key || '').trim());
  }

  function getLegacyMergeCandidates(){
    const currentKey = getCurrentUserKey();
    const candidates = new Map();

    function ensureCandidate(rawKey){
      const key = sanitize(rawKey).trim();
      if(!key || key === currentKey || isUidLikeKey(key)) return null;
      if(!candidates.has(key)){
        candidates.set(key, {
          key,
          label: key,
          ratingMatches: 0,
          chooserMatches: 0,
          winnerMatches: 0,
          movieIds: new Set()
        });
      }
      return candidates.get(key);
    }

    state.movies.forEach(movie => {
      ensureMovieShape(movie);
      Object.keys(movie.ratings || {}).forEach(key => {
        if(movie.ratingNames?.[key]) return;
        const candidate = ensureCandidate(key);
        if(!candidate) return;
        candidate.ratingMatches += 1;
        candidate.movieIds.add(movie.id);
      });

      const chooserAlias = !movie.chooserId
        ? sanitize(movie.chooserName || movie.chooser || '').trim()
        : '';
      const chooserCandidate = ensureCandidate(chooserAlias);
      if(chooserCandidate) chooserCandidate.chooserMatches += 1;
    });

    if(currentWinner && !currentWinner.personKey){
      const winnerCandidate = ensureCandidate(currentWinner.personName || '');
      if(winnerCandidate) winnerCandidate.winnerMatches += 1;
    }

    return Array.from(candidates.values())
      .map(candidate => ({
        key: candidate.key,
        label: candidate.label,
        ratingMatches: candidate.ratingMatches,
        chooserMatches: candidate.chooserMatches,
        winnerMatches: candidate.winnerMatches,
        movieCount: candidate.movieIds.size
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  function describeMergeCandidate(candidate){
    const parts = [];
    if(candidate.ratingMatches) parts.push(`${candidate.ratingMatches} rating${candidate.ratingMatches === 1 ? '' : 's'}`);
    if(candidate.chooserMatches) parts.push(`${candidate.chooserMatches} chooser`);
    if(candidate.winnerMatches) parts.push(`${candidate.winnerMatches} winner`);
    return parts.join(' • ') || 'Legacy name';
  }

  function buildMergeAnalysis(selectedAliases = mergeState.selectedAliases){
    const currentKey = getCurrentUserKey();
    const selectedSet = new Set(selectedAliases);
    const conflicts = [];
    let ratingMatches = 0;
    let chooserMatches = 0;
    let winnerMatches = 0;

    state.movies.forEach(movie => {
      ensureMovieShape(movie);
      const aliasKeys = Object.keys(movie.ratings || {}).filter(key => selectedSet.has(key));
      if(aliasKeys.length){
        ratingMatches += aliasKeys.length;
        const sourceKeys = [];
        if(movie.ratings[currentKey]) sourceKeys.push(currentKey);
        aliasKeys.forEach(key => {
          if(!sourceKeys.includes(key)) sourceKeys.push(key);
        });
        if(sourceKeys.length > 1){
          conflicts.push({
            movieId: movie.id,
            movieTitle: movie.title,
            movieYear: movie.year,
            sourceKeys
          });
        }
      }

      const chooserAlias = !movie.chooserId
        ? sanitize(movie.chooserName || movie.chooser || '').trim()
        : '';
      if(chooserAlias && selectedSet.has(chooserAlias)) chooserMatches += 1;
    });

    if(currentWinner && !currentWinner.personKey){
      const winnerAlias = sanitize(currentWinner.personName || '').trim();
      if(winnerAlias && selectedSet.has(winnerAlias)) winnerMatches += 1;
    }

    return {
      selectedAliases: [...selectedSet],
      ratingMatches,
      chooserMatches,
      winnerMatches,
      conflicts
    };
  }

  function formatMergeRatingSummary(entry){
    const totals = getRatingTotals(entry);
    return `B: ${totals.bMovieScore} • M: ${totals.mainstreamScore} • Final: ${totals.finalScore > 0 ? '+' : ''}${totals.finalScore}`;
  }

  function closeMergeDialog(){
    dom.mergeDialog?.close?.();
    dom.mergeDialog?.removeAttribute('open');
  }

  function renderMergeDialog(){
    const candidates = getLegacyMergeCandidates();
    const availableCandidates = candidates.filter(candidate => !mergeState.selectedAliases.includes(candidate.key));

    if(dom.mergeCandidateSelect){
      dom.mergeCandidateSelect.innerHTML = '<option value="">Select old score name...</option>';
      availableCandidates.forEach(candidate => {
        const option = document.createElement('option');
        option.value = candidate.key;
        option.textContent = `${candidate.label} (${describeMergeCandidate(candidate)})`;
        dom.mergeCandidateSelect.appendChild(option);
      });
      dom.mergeCandidateSelect.disabled = availableCandidates.length === 0;
    }

    if(dom.addMergeCandidate) dom.addMergeCandidate.disabled = availableCandidates.length === 0;

    if(dom.mergeCandidateHint){
      if(!currentUser){
        dom.mergeCandidateHint.textContent = 'Sign in with Google to merge old names.';
      } else if(candidates.length === 0){
        dom.mergeCandidateHint.textContent = 'No unclaimed legacy names were found.';
      } else if(availableCandidates.length === 0){
        dom.mergeCandidateHint.textContent = 'All available old names are already selected below.';
      } else {
        dom.mergeCandidateHint.textContent = 'Choose an old typed name from the dropdown, then add it to this merge.';
      }
    }

    if(dom.selectedMergeAliases){
      dom.selectedMergeAliases.innerHTML = '';
      mergeState.selectedAliases.forEach(alias => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'merge-chip-button';
        button.dataset.alias = alias;
        button.title = 'Remove from merge';
        button.innerHTML = `<span class="merge-chip">${sanitize(alias)} <span class="merge-chip-remove">×</span></span>`;
        button.addEventListener('click', () => {
          mergeState.selectedAliases = mergeState.selectedAliases.filter(item => item !== alias);
          renderMergeDialog();
        });
        dom.selectedMergeAliases.appendChild(button);
      });
    }

    const analysis = buildMergeAnalysis();

    if(dom.mergePreview){
      if(!mergeState.selectedAliases.length){
        dom.mergePreview.innerHTML = '<p class="merge-empty">Choose at least one old typed name from the dropdown to preview the merge.</p>';
      } else {
        const winnerNotice = analysis.winnerMatches
          ? `<p class="merge-empty">Winner attribution will also move to ${getCurrentUserName()}.</p>`
          : '';
        const conflictNotice = analysis.conflicts.length
          ? '<p class="merge-warning">Some movies have more than one score. Use the dropdowns below to choose which one to keep.</p>'
          : '';

        dom.mergePreview.innerHTML = `
          <div class="merge-stat-grid">
            <div class="merge-stat">
              <span class="merge-stat-label">Selected Names</span>
              <span class="merge-stat-value">${analysis.selectedAliases.length}</span>
            </div>
            <div class="merge-stat">
              <span class="merge-stat-label">Ratings Found</span>
              <span class="merge-stat-value">${analysis.ratingMatches}</span>
            </div>
            <div class="merge-stat">
              <span class="merge-stat-label">Chooser Updates</span>
              <span class="merge-stat-value">${analysis.chooserMatches}</span>
            </div>
            <div class="merge-stat">
              <span class="merge-stat-label">Conflicts</span>
              <span class="merge-stat-value">${analysis.conflicts.length}</span>
            </div>
          </div>
          ${winnerNotice}
          ${conflictNotice}
        `;
      }
    }

    if(dom.mergeConflicts){
      dom.mergeConflicts.innerHTML = '';
      if(!mergeState.selectedAliases.length){
        dom.mergeConflicts.innerHTML = '<p class="merge-empty">Conflict choices will appear here if the same movie has more than one old score.</p>';
      } else if(!analysis.conflicts.length){
        dom.mergeConflicts.innerHTML = '<p class="merge-empty">No duplicate movie ratings found. This merge can be applied directly.</p>';
      } else {
        analysis.conflicts.forEach(conflict => {
          const movie = state.movies.find(item => item.id === conflict.movieId);
          if(!movie) return;

          const card = document.createElement('div');
          card.className = 'merge-conflict-card';

          const heading = document.createElement('div');
          heading.className = 'merge-conflict-head';
          heading.innerHTML = `
            <div>
              <div class="merge-conflict-title">${sanitize(conflict.movieTitle)}${conflict.movieYear ? ` (${conflict.movieYear})` : ''}</div>
              <div class="merge-conflict-note">Choose which score should stay on your Google account for this movie.</div>
            </div>
          `;

          const select = document.createElement('select');
          select.className = 'merge-conflict-select';
          select.dataset.movieId = conflict.movieId;

          const defaultKey = movie.ratings[getCurrentUserKey()] ? getCurrentUserKey() : conflict.sourceKeys[0];
          conflict.sourceKeys.forEach(sourceKey => {
            const option = document.createElement('option');
            const optionLabel = sourceKey === getCurrentUserKey()
              ? `${getCurrentUserName()} (current account)`
              : getRatingLabel(movie, sourceKey);
            option.value = sourceKey;
            option.textContent = `${optionLabel} — ${formatMergeRatingSummary(movie.ratings[sourceKey])}`;
            if(sourceKey === defaultKey) option.selected = true;
            select.appendChild(option);
          });

          card.appendChild(heading);
          card.appendChild(select);
          dom.mergeConflicts.appendChild(card);
        });
      }
    }

    if(dom.applyMerge) dom.applyMerge.disabled = !mergeState.selectedAliases.length;
  }

  function collectMergeConflictChoices(analysis){
    const choices = new Map();
    for(const conflict of analysis.conflicts){
      const select = dom.mergeConflicts?.querySelector(`.merge-conflict-select[data-movie-id="${conflict.movieId}"]`);
      const selectedValue = select?.value;
      if(!selectedValue){
        alert(`Choose which score to keep for ${conflict.movieTitle}.`);
        select?.focus();
        return null;
      }
      choices.set(conflict.movieId, selectedValue);
    }
    return choices;
  }

  function applyMergeSelection(event){
    event.preventDefault();
    if(!requireSignedIn('Please sign in with Google before merging old scores.')) return;

    const selectedAliases = [...new Set(mergeState.selectedAliases.filter(Boolean))];
    if(!selectedAliases.length){
      alert('Select an old score name first.');
      dom.mergeCandidateSelect?.focus();
      return;
    }

    const analysis = buildMergeAnalysis(selectedAliases);
    const conflictChoices = collectMergeConflictChoices(analysis);
    if(!conflictChoices) return;

    const currentKey = getCurrentUserKey();
    const currentName = getCurrentUserName();
    const selectedSet = new Set(selectedAliases);
    let changed = false;
    let winnerChanged = false;

    state.movies.forEach(movie => {
      ensureMovieShape(movie);
      const aliasKeys = Object.keys(movie.ratings || {}).filter(key => selectedSet.has(key));
      if(aliasKeys.length){
        const hasCurrentRating = !!movie.ratings[currentKey];
        const chosenSource = conflictChoices.get(movie.id) || (hasCurrentRating ? currentKey : aliasKeys[0]);
        const chosenEntry = movie.ratings[chosenSource] || movie.ratings[currentKey] || movie.ratings[aliasKeys[0]];

        aliasKeys.forEach(key => {
          if(key in movie.ratings){
            delete movie.ratings[key];
            changed = true;
          }
          if(movie.ratingNames && key in movie.ratingNames){
            delete movie.ratingNames[key];
          }
        });

        if(chosenEntry){
          if(movie.ratings[currentKey] !== chosenEntry) changed = true;
          movie.ratings[currentKey] = chosenEntry;
          movie.ratingNames[currentKey] = currentName;
        }
      }

      const chooserAlias = !movie.chooserId
        ? sanitize(movie.chooserName || movie.chooser || '').trim()
        : '';
      if(chooserAlias && selectedSet.has(chooserAlias)){
        if(movie.chooserId !== currentKey || movie.chooserName !== currentName || movie.chooser !== currentName){
          movie.chooserId = currentKey;
          movie.chooserName = currentName;
          movie.chooser = currentName;
          changed = true;
        }
      }
    });

    if(currentWinner && !currentWinner.personKey){
      const winnerAlias = sanitize(currentWinner.personName || '').trim();
      if(winnerAlias && selectedSet.has(winnerAlias)){
        currentWinner.personKey = currentKey;
        currentWinner.personName = currentName;
        winnerChanged = true;
        changed = true;
      }
    }

    if(!changed){
      alert('No matching old scores were found for the selected names.');
      return;
    }

    persist();

    if(winnerChanged){
      localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
      if(remote.enabled && firestore) saveWinnerToFirebase(currentWinner);
    }

    renderAll();
    if(currentWinner) displayWinner();

    mergeState.selectedAliases = [];
    renderMergeDialog();
    closeMergeDialog();
    alert(`Merged ${selectedAliases.length} old ${selectedAliases.length === 1 ? 'name' : 'names'} into ${currentName}.`);
  }

  function generateCategoryGrid() {
    if (!dom.categoryGrid) return;
    dom.categoryGrid.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const div = document.createElement('div');
      div.className = 'rating-category';
      div.innerHTML = `
        <div class="category-header">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-label">${cat.label}</span>
        </div>
        <p class="category-question">${cat.question}</p>
        <select name="${cat.key}" class="rating-select" required>
          <option value="">— Select —</option>
          ${cat.levels.map((level, i) => `<option value="${i - 5}">${level}</option>`).join('')}
        </select>
      `;
      dom.categoryGrid.appendChild(div);
    });

    BONUS_CATEGORIES.forEach(cat => {
      const div = document.createElement('div');
      div.className = 'rating-category bonus-category';
      div.innerHTML = `
        <div class="category-header">
          <span class="category-icon">${cat.icon}</span>
          <span class="category-label">${cat.label}</span>
          <span class="bonus-tag">Bonus</span>
        </div>
        <p class="category-question">${cat.question}</p>
        <select name="${cat.key}" class="rating-select">
          <option value="">— Select —</option>
          ${cat.levels.map((level, i) => `<option value="${i - 5}">${level}</option>`).join('')}
        </select>
      `;
      dom.categoryGrid.appendChild(div);
    });

    dom.categoryGrid.querySelectorAll('.rating-select').forEach(sel => {
      sel.addEventListener('change', () => {
        sel.classList.toggle('has-value', sel.value !== '');
      });
    });
  }

  function loadState(){
    try {
      const raw = localStorage.getItem(LS_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(parsed.movies) return normalizeState(parsed);
      }
    } catch {}

    try {
      const v4raw = localStorage.getItem(LS_KEY_V4);
      if(v4raw){
        const v4 = JSON.parse(v4raw);
        if(v4.movies){
          v4.movies.forEach(m => {
            m.ratings = {};
            delete m.legacySets;
            delete m.legacyRatings;
          });
          const migrated = normalizeState({ movies: v4.movies });
          localStorage.setItem(LS_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch {}

    try {
      const v3raw = localStorage.getItem(LS_KEY_V3);
      if(v3raw){
        const v3 = JSON.parse(v3raw);
        if(v3.movies){
          v3.movies.forEach(m => {
            m.ratings = {};
            delete m.legacySets;
            delete m.legacyRatings;
          });
          const migrated = normalizeState({ movies: v3.movies });
          localStorage.setItem(LS_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch {}

    try {
      const v2raw = localStorage.getItem(LS_KEY_V2);
      if(v2raw){
        const v2 = JSON.parse(v2raw);
        if(v2.movies){
          v2.movies.forEach(m => {
            m.ratings = {};
            delete m.legacySets;
            delete m.legacyRatings;
          });
          const migrated = normalizeState({ movies: v2.movies });
          localStorage.setItem(LS_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch {}

    try {
      const v1raw = localStorage.getItem('bmovie:data:v1');
      if(v1raw){
        const v1 = JSON.parse(v1raw);
        if(v1.movies){
          v1.movies.forEach(m => {
            m.ratings = {};
            delete m.legacySets;
            delete m.legacyRatings;
          });
          const migrated = normalizeState({ movies: v1.movies });
          localStorage.setItem(LS_KEY, JSON.stringify(migrated));
          return migrated;
        }
      }
    } catch {}

    return { movies: [] };
  }

  function sanitizeForFirestore(movie){
    ensureMovieShape(movie);
    return {
      id: movie.id,
      title: movie.title,
      year: movie.year ?? null,
      notes: movie.notes || '',
      addedAt: movie.addedAt,
      ratings: movie.ratings || {},
      ratingNames: movie.ratingNames || {},
      chooser: movie.chooser || movie.chooserName || '',
      chooserId: movie.chooserId || null,
      chooserName: movie.chooserName || movie.chooser || ''
    };
  }

  function updateSyncStatus(mode, label){
    if(!dom.syncStatus) return;
    dom.syncStatus.dataset.mode = mode;
    dom.syncStatus.textContent = label;
  }

  async function initFirebase(){
    if(!window.FIREBASE_ENABLED || !window.FIREBASE_CONFIG){
      authApi.status = 'disabled';
      authApi.disabledReason = 'Missing Firebase config or FIREBASE_ENABLED is false.';
      updateAuthPanel();
      return;
    }

    try {
      authApi.status = 'loading';
      updateAuthPanel();
      updateSyncStatus('connecting', 'Connecting…');

      const [
        { initializeApp },
        { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc },
        {
          getAuth,
          onAuthStateChanged,
          GoogleAuthProvider,
          signInWithPopup,
          signOut,
          setPersistence,
          browserLocalPersistence
        }
      ] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js')
      ]);

      const app = initializeApp(window.FIREBASE_CONFIG);
      firestore = getFirestore(app);
      moviesCollection = collection(firestore, 'bmovie_movies');
      remote = { enabled: true, doc, setDoc, deleteDoc, onSnapshot, getDoc, collection };

      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await setPersistence(auth, browserLocalPersistence);

      authApi = {
        status: 'ready',
        disabledReason: '',
        enabled: true,
        instance: auth,
        provider,
        signInWithPopup,
        signOut
      };

      document.getElementById('storageModeNote')?.replaceChildren(
        document.createTextNode('Shared mode: Live synced via Firestore. Google sign-in powers new ratings.')
      );

      updateSyncStatus('remote', 'Live Sync');
      updateAuthPanel();
      attachRemoteListener();
      attachWinnerListener();
      await loadRemoteWinner();

      onAuthStateChanged(auth, async user => {
        currentUser = user;
        if(!user){
          if(unsubscribeUserProfile) unsubscribeUserProfile();
          unsubscribeUserProfile = null;
          currentUserProfile = null;
          pendingChoices = [];
          mergeState.selectedAliases = [];
          closeMergeDialog();
        } else {
          await loadCurrentUserProfile(user.uid);
          propagateCurrentUserName(getCurrentUserName());
          attachUserProfileListener(user.uid);
          loadPendingChoices();
        }
        renderAll();
      });

      if(window.FIREBASE_CONFIG.measurementId){
        try {
          const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js');
          getAnalytics(app);
        } catch (analyticsError) {
          console.warn('[Firebase] analytics init failed (ignored)', analyticsError);
        }
      }
    } catch (error) {
      console.warn('[Firebase] init failed – sign-in disabled.', error);
      remote.enabled = false;
      authApi.status = 'disabled';
      authApi.disabledReason = humanizeAuthError(error);
      updateSyncStatus('error', 'Local Only');
      updateAuthPanel();
    }
  }

  function attachRemoteListener(){
    if(!remote.enabled || !moviesCollection) return;
    if(unsubscribeMovies) unsubscribeMovies();
    unsubscribeMovies = remote.onSnapshot(
      moviesCollection,
      snapshot => {
        const remoteMovies = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if(data?.id) remoteMovies.push(ensureMovieShape(data));
        });
        mergeRemoteState(remoteMovies);
      },
      error => console.warn('[Firebase] listener error', error)
    );
  }

  function mergeRemoteState(remoteMovies){
    const map = new Map(state.movies.map(movie => [movie.id, ensureMovieShape(movie)]));
    remoteMovies.forEach(remoteMovie => {
      const existing = map.get(remoteMovie.id);
      if(existing){
        map.set(remoteMovie.id, ensureMovieShape({ ...existing, ...remoteMovie }));
      } else {
        map.set(remoteMovie.id, ensureMovieShape(remoteMovie));
      }
    });

    state.movies = normalizeState({
      movies: Array.from(map.values()).sort((a, b) => b.addedAt - a.addedAt)
    }).movies;

    localStorage.setItem(LS_KEY, JSON.stringify(state));
    renderAll();
  }

  function persist(){
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    if(!remote.enabled || !moviesCollection) return;
    state.movies.forEach(movie => {
      remote
        .setDoc(remote.doc(moviesCollection, movie.id), sanitizeForFirestore(movie))
        .catch(error => console.warn('[Firebase] write fail', error));
    });
  }

  function removeUserRating(movieId, ratingKey){
    const movie = state.movies.find(item => item.id === movieId);
    if(!movie?.ratings?.[ratingKey]) return;
    delete movie.ratings[ratingKey];
    delete movie.ratingNames?.[ratingKey];
    persist();
    updateMovieCard(movieId);
    updateScoreTracker();
    updateWinnerDropdowns();
  }

  function updateWinnerDropdowns(){
    if(!dom.winnerMovie || !dom.winnerPerson) return;

    dom.winnerMovie.innerHTML = '<option value="">Select movie...</option>';
    dom.winnerPerson.innerHTML = '<option value="">Select person...</option>';

    state.movies.forEach(movie => {
      const option = document.createElement('option');
      option.value = movie.id;
      option.textContent = `${movie.title} (${movie.year || 'Unknown'})`;
      dom.winnerMovie.appendChild(option);
    });

    const allRaters = new Map();
    state.movies.forEach(movie => {
      Object.keys(movie.ratings || {}).forEach(key => {
        allRaters.set(key, getRatingLabel(movie, key));
      });
    });

    Array.from(allRaters.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([key, label]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = label;
        dom.winnerPerson.appendChild(option);
      });
  }

  function setWinner(movieId, personKey){
    const movie = state.movies.find(item => item.id === movieId);
    if(!movie) return;

    const previousTheme = currentWinner?.movieId === movieId && currentWinner?.personKey === personKey
      ? currentWinner.nextTheme || null
      : null;

    currentWinner = {
      movieId,
      movieTitle: movie.title,
      movieYear: movie.year,
      personKey,
      personName: getKnownName(personKey),
      nextRules: ['', '', ''],
      nextTheme: previousTheme,
      setAt: Date.now()
    };

    displayWinner();
    localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
    if(remote.enabled && firestore) saveWinnerToFirebase(currentWinner);
  }

  function clearWinner(){
    currentWinner = null;
    dom.winnerDisplay.style.display = 'none';
    dom.winnerForm.style.display = 'block';
    dom.winnerForm.reset();
    if(dom.winnerEditorDropdown) dom.winnerEditorDropdown.open = false;
    if(dom.editTheme) dom.editTheme.value = '';
    if(dom.editRule1) dom.editRule1.value = '';
    if(dom.editRule2) dom.editRule2.value = '';
    if(dom.editRule3) dom.editRule3.value = '';
    localStorage.removeItem('bmovie:winner');
    if(remote.enabled && firestore) clearWinnerFromFirebase();
  }

  function displayWinner(){
    if(!currentWinner) return;

    const titleEl = dom.winnerDisplay.querySelector('.winner-title');
    const subtitleEl = dom.winnerDisplay.querySelector('.winner-subtitle');
    const rulesEl = dom.winnerDisplay.querySelector('.winner-rules');
    const themeEl = dom.winnerDisplay.querySelector('.winner-theme');
    const themeEditor = dom.winnerDisplay.querySelector('.winner-theme-editor');
    const ruleValues = normalizeWinnerRules(currentWinner);

    currentWinner.nextRules = ruleValues;

    titleEl.textContent = `${currentWinner.movieTitle} (${currentWinner.movieYear || 'Unknown'})`;
    subtitleEl.textContent = `Champion: ${currentWinner.personName}`;

    if(rulesEl){
      rulesEl.replaceChildren();
      const filledRules = ruleValues
        .map((value, index) => ({ value, index: index + 1 }))
        .filter(item => item.value);

      if(filledRules.length){
        filledRules.forEach(item => {
          const ruleItem = document.createElement('div');
          ruleItem.className = 'winner-rule-item';
          ruleItem.textContent = `Rule ${item.index}: ${item.value}`;
          rulesEl.appendChild(ruleItem);
        });
        rulesEl.style.display = 'block';
      } else {
        rulesEl.style.display = 'none';
      }
    }

    if(currentWinner.nextTheme){
      themeEl.textContent = `Next Theme: ${currentWinner.nextTheme}`;
      themeEl.style.display = 'block';
    } else {
      themeEl.style.display = 'none';
    }

    if(dom.editTheme && themeEditor){
      dom.editTheme.value = currentWinner.nextTheme || '';
      if(dom.editRule1) dom.editRule1.value = ruleValues[0] || '';
      if(dom.editRule2) dom.editRule2.value = ruleValues[1] || '';
      if(dom.editRule3) dom.editRule3.value = ruleValues[2] || '';
      themeEditor.style.display = 'block';
      if(dom.winnerEditorDropdown) dom.winnerEditorDropdown.open = false;
    }

    dom.winnerDisplay.style.display = 'block';
    dom.winnerForm.style.display = 'none';
  }

  function loadWinner(){
    try {
      const stored = localStorage.getItem('bmovie:winner');
      if(stored){
        currentWinner = JSON.parse(stored);
        currentWinner.nextRules = normalizeWinnerRules(currentWinner);
        delete currentWinner.nextRuleId;
        displayWinner();
      }
    } catch (error) {
      console.warn('Failed to load winner:', error);
    }
  }

  async function saveWinnerToFirebase(winner){
    try {
      const winnersCollection = remote.collection(firestore, 'bmovie_winners');
      const winnerDoc = remote.doc(winnersCollection, 'current');
      await remote.setDoc(winnerDoc, { ...winner, updatedAt: Date.now() });
    } catch (error) {
      console.warn('[Firebase] Failed to save winner:', error);
    }
  }

  async function clearWinnerFromFirebase(){
    try {
      const winnersCollection = remote.collection(firestore, 'bmovie_winners');
      const winnerDoc = remote.doc(winnersCollection, 'current');
      await remote.deleteDoc(winnerDoc);
    } catch (error) {
      console.warn('[Firebase] Failed to clear winner:', error);
    }
  }

  async function loadRemoteWinner(){
    if(!remote.enabled || !firestore) return;
    try {
      const winnersCollection = remote.collection(firestore, 'bmovie_winners');
      const winnerDoc = remote.doc(winnersCollection, 'current');
      const docSnap = await remote.getDoc(winnerDoc);
      if(docSnap.exists()){
        currentWinner = docSnap.data();
        currentWinner.nextRules = normalizeWinnerRules(currentWinner);
        delete currentWinner.nextRuleId;
        localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
        displayWinner();
      }
    } catch (error) {
      console.warn('[Firebase] Failed to load remote winner:', error);
    }
  }

  function attachWinnerListener(){
    if(!remote.enabled || !firestore) return;
    if(unsubscribeWinner) unsubscribeWinner();
    try {
      const winnersCollection = remote.collection(firestore, 'bmovie_winners');
      const winnerDoc = remote.doc(winnersCollection, 'current');
      unsubscribeWinner = remote.onSnapshot(
        winnerDoc,
        docSnap => {
          if(docSnap.exists()){
            currentWinner = docSnap.data();
            currentWinner.nextRules = normalizeWinnerRules(currentWinner);
            delete currentWinner.nextRuleId;
            localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
            displayWinner();
            return;
          }

          if(currentWinner){
            currentWinner = null;
            dom.winnerDisplay.style.display = 'none';
            dom.winnerForm.style.display = 'block';
            dom.winnerForm.reset();
            if(dom.winnerEditorDropdown) dom.winnerEditorDropdown.open = false;
            if(dom.editTheme) dom.editTheme.value = '';
            if(dom.editRule1) dom.editRule1.value = '';
            if(dom.editRule2) dom.editRule2.value = '';
            if(dom.editRule3) dom.editRule3.value = '';
            localStorage.removeItem('bmovie:winner');
          }
        },
        error => console.warn('[Firebase] Winner listener error:', error)
      );
      window.unsubscribeWinner = unsubscribeWinner;
    } catch (error) {
      console.warn('[Firebase] Failed to attach winner listener:', error);
    }
  }

  function updateScoreTracker(){
    if(!dom.trackerScores) return;

    const chooserScores = {};
    state.movies.forEach(movie => {
      const chooserKey = movie.chooserId || movie.chooserName || movie.chooser;
      const chooserLabel = getChooserLabel(movie);
      if(!chooserKey || !chooserLabel) return;

      const aggregates = getAggregates(movie);
      if(aggregates.raterCount < 3) return;

      const movieBMovieScore = aggregates.avgBMovieScore;
      const movieMainstreamScore = aggregates.avgMainstreamScore;
      const movieFinalScore = aggregates.avgFinalScore;

      if(!chooserScores[chooserKey]){
        chooserScores[chooserKey] = {
          label: chooserLabel,
          totalBMovieScore: 0,
          totalMainstreamScore: 0,
          totalFinalScore: 0,
          movieCount: 0,
          avgBMovieScore: 0,
          avgMainstreamScore: 0,
          avgFinalScore: 0
        };
      }

      chooserScores[chooserKey].label = chooserLabel;
      chooserScores[chooserKey].totalBMovieScore += movieBMovieScore;
      chooserScores[chooserKey].totalMainstreamScore += movieMainstreamScore;
      chooserScores[chooserKey].totalFinalScore += movieFinalScore;
      chooserScores[chooserKey].movieCount += 1;
      chooserScores[chooserKey].avgBMovieScore = (
        chooserScores[chooserKey].totalBMovieScore / chooserScores[chooserKey].movieCount
      );
      chooserScores[chooserKey].avgMainstreamScore = (
        chooserScores[chooserKey].totalMainstreamScore / chooserScores[chooserKey].movieCount
      );
      chooserScores[chooserKey].avgFinalScore = (
        chooserScores[chooserKey].totalFinalScore / chooserScores[chooserKey].movieCount
      );
    });

    const sortedScores = Object.values(chooserScores).sort(
      (a, b) => b.totalFinalScore - a.totalFinalScore || b.totalBMovieScore - a.totalBMovieScore
    );

    if(sortedScores.length === 0){
      dom.trackerScores.innerHTML = '<span class="no-scores">Total scores appear after a movie gets 3 reviews.</span>';
      return;
    }

    const topScore = sortedScores[0]?.totalFinalScore || 0;
    const topBScore = Math.max(...sortedScores.map(scorer => scorer.totalBMovieScore));
    const topMainstreamMagnitude = Math.max(...sortedScores.map(scorer => Math.abs(scorer.totalMainstreamScore)));
    dom.trackerScores.innerHTML = '';

    sortedScores.forEach((scorer, index) => {
      const scoreItem = document.createElement('div');
      const isBChampion = topBScore > 0 && scorer.totalBMovieScore === topBScore;
      const isMainstreamChampion = topMainstreamMagnitude > 0 && Math.abs(scorer.totalMainstreamScore) === topMainstreamMagnitude;
      const isDualChampion = isBChampion && isMainstreamChampion;
      const rankClass = index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : 'rank-standard';
      const championClass = isDualChampion
        ? 'dual-champ'
        : isBChampion
          ? 'bmovie-champ'
          : isMainstreamChampion
            ? 'mainstream-champ'
            : '';

      scoreItem.className = `score-item-tracker ${scorer.totalFinalScore === topScore && topScore !== 0 ? 'top-scorer' : ''} ${championClass}`.trim();

      let badgeMarkup = '';
      if(isDualChampion){
        badgeMarkup = '<span class="tracker-champ-badge dual-badge">DUAL CHAMP</span>';
      } else if(isBChampion){
        badgeMarkup = '<span class="tracker-champ-badge bmovie-badge">B-MOVIE CHAMP</span>';
      } else if(isMainstreamChampion){
        badgeMarkup = '<span class="tracker-champ-badge mainstream-badge">MAINSTREAM CHAMP</span>';
      }

      scoreItem.innerHTML = `
        <div class="tracker-card-top">
          <span class="tracker-rank ${rankClass}">#${index + 1}</span>
          <div class="tracker-card-status">
            ${badgeMarkup}
            <span class="tracker-movies">${scorer.movieCount} movie${scorer.movieCount === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div class="tracker-player-name">${sanitize(scorer.label)}</div>
        <div class="tracker-score-grid">
          <div class="tracker-stat tracker-stat-bmovie">
            <span class="tracker-stat-label">B-Movie</span>
            <strong class="tracker-stat-value">${formatSignedScore(scorer.totalBMovieScore)}</strong>
          </div>
          <div class="tracker-stat tracker-stat-mainstream">
            <span class="tracker-stat-label">Mainstream</span>
            <strong class="tracker-stat-value">${formatSignedScore(scorer.totalMainstreamScore)}</strong>
          </div>
        </div>
        <div class="tracker-meta-row">
          <span class="tracker-meta-pill">Avg B ${formatSignedScore(scorer.avgBMovieScore)}</span>
          <span class="tracker-meta-pill">Avg M ${formatSignedScore(scorer.avgMainstreamScore)}</span>
        </div>
      `;
      scoreItem.title = `${scorer.label}: B-Movie ${formatSignedScore(scorer.totalBMovieScore)}, Mainstream ${formatSignedScore(scorer.totalMainstreamScore)} across ${scorer.movieCount} qualified movie(s). Avg B-Movie ${formatSignedScore(scorer.avgBMovieScore)}, Avg Mainstream ${formatSignedScore(scorer.avgMainstreamScore)}.`;
      dom.trackerScores.appendChild(scoreItem);
    });
  }

  function renderAll(){
    dom.moviesList.innerHTML = '';
    state.movies.forEach(movie => renderMovie(movie));
    renderPendingChoices();
    updateWinnerDropdowns();
    updateScoreTracker();
    applyFilters();
    updateAuthPanel();
  }

  function renderMovie(movie, prepend = false){
    ensureMovieShape(movie);
    const clone = dom.template.content.firstElementChild.cloneNode(true);
    clone.dataset.id = movie.id;
    clone.querySelector('.movie-title').textContent = movie.title;
    clone.querySelector('.year').textContent = movie.year || '';

    const notesEl = clone.querySelector('.notes');
    const chooserLabel = getChooserLabel(movie);
    let notesText = movie.notes || '';
    if(chooserLabel){
      notesText = `Chosen by: ${chooserLabel}${movie.notes ? ` • ${movie.notes}` : ''}`;
    }
    notesEl.textContent = notesText;

    const catRow = clone.querySelector('.score-row.categories');
    for(const cat of CATEGORIES){
      const span = document.createElement('span');
      span.className = 'cat-badge';
      span.dataset.cat = cat.key;
      span.title = cat.label;
      span.textContent = `${cat.icon} –`;
      catRow.appendChild(span);
    }

    for(const cat of BONUS_CATEGORIES){
      const span = document.createElement('span');
      span.className = 'cat-badge bonus';
      span.dataset.cat = cat.key;
      span.title = `${cat.label} (bonus - not counted in total)`;
      span.textContent = `${cat.icon} –`;
      catRow.appendChild(span);
    }

    clone.querySelector('.open-rate').addEventListener('click', () => openDialog(movie));
    clone.querySelector('.delete-btn').addEventListener('click', () => {
      if(!requireSignedIn('Please sign in with Google before deleting a movie.')) return;
      if(!confirm('Delete this movie?')) return;
      state.movies = state.movies.filter(item => item.id !== movie.id);
      persist();
      if(remote.enabled && moviesCollection){
        remote.deleteDoc(remote.doc(moviesCollection, movie.id)).catch(error => {
          console.warn('[Firebase] delete fail', error);
        });
      }
      clone.remove();
      applyFilters();
      updateWinnerDropdowns();
      updateScoreTracker();
    });

    updateCardScores(movie, clone);
    updateIndividualReviews(movie, clone);

    if(prepend) dom.moviesList.prepend(clone);
    else dom.moviesList.appendChild(clone);
  }

  function updateMovieCard(id){
    const movie = state.movies.find(item => item.id === id);
    if(!movie) return;
    const card = dom.moviesList.querySelector(`.movie-card[data-id="${id}"]`);
    if(card){
      const notesEl = card.querySelector('.notes');
      const chooserLabel = getChooserLabel(movie);
      notesEl.textContent = chooserLabel
        ? `Chosen by: ${chooserLabel}${movie.notes ? ` • ${movie.notes}` : ''}`
        : (movie.notes || '');
      updateCardScores(movie, card);
      updateIndividualReviews(movie, card);
    }
  }

  function updateCardScores(movie, card){
    const actorKey = getCurrentUserKey();
    const userHasRated = !!(actorKey && movie.ratings?.[actorKey]);
    const aggregates = getAggregates(movie);
    const raterCount = aggregates.raterCount;
    const lockNeeded = raterCount > 0 && !userHasRated;

    for(const cat of CATEGORIES){
      const badge = card.querySelector(`.cat-badge[data-cat="${cat.key}"]`);
      if(!badge) continue;
      if(lockNeeded){
        badge.textContent = `${cat.icon} ?`;
        badge.title = `${cat.label} (locked)`;
        badge.dataset.empty = 'true';
        badge.dataset.locked = 'true';
      } else {
        const avg = aggregates.categoryAverages[cat.key];
        badge.textContent = `${cat.icon} ${Number.isFinite(avg) ? avg.toFixed(1) : '–'}`;
        badge.title = cat.label;
        badge.dataset.empty = Number.isFinite(avg) ? 'false' : 'true';
        badge.dataset.locked = 'false';
      }
    }

    for(const cat of BONUS_CATEGORIES){
      const badge = card.querySelector(`.cat-badge[data-cat="${cat.key}"]`);
      if(!badge) continue;
      if(lockNeeded){
        badge.textContent = `${cat.icon} ?`;
        badge.title = `${cat.label} (bonus - locked)`;
        badge.dataset.empty = 'true';
        badge.dataset.locked = 'true';
      } else {
        const avg = aggregates.bonusAverages[cat.key];
        badge.textContent = `${cat.icon} ${Number.isFinite(avg) ? avg.toFixed(1) : '–'}`;
        badge.title = `${cat.label} (bonus - not counted in total)`;
        badge.dataset.empty = Number.isFinite(avg) ? 'false' : 'true';
        badge.dataset.locked = 'false';
      }
    }

    const bMovieEl = card.querySelector('.bmovie-val');
    const mainstreamEl = card.querySelector('.mainstream-val');
    const finalEl = card.querySelector('.final-val');
    const raterEl = card.querySelector('.rater-count');
    const tierEmoji = card.querySelector('.tier-emoji');
    const tierText = card.querySelector('.tier-text');
    const cardTier = card.querySelector('.card-tier');

    if(lockNeeded){
      if(bMovieEl) bMovieEl.textContent = '?';
      if(mainstreamEl) mainstreamEl.textContent = '?';
      if(finalEl) finalEl.textContent = '?';
      raterEl.textContent = '(hidden)';
      if(cardTier) cardTier.style.display = 'none';
    } else {
      if(bMovieEl) bMovieEl.textContent = raterCount ? aggregates.avgBMovieScore.toFixed(1) : '0';
      if(mainstreamEl) mainstreamEl.textContent = raterCount ? aggregates.avgMainstreamScore.toFixed(1) : '0';
      if(finalEl){
        const finalValue = raterCount ? aggregates.avgFinalScore.toFixed(1) : '0';
        finalEl.textContent = Number(finalValue) > 0 ? `+${finalValue}` : finalValue;
      }
      raterEl.textContent = raterCount ? `(${raterCount} rater${raterCount === 1 ? '' : 's'})` : '';

      if(cardTier && tierEmoji && tierText && raterCount > 0){
        const tier = getTrashTier(Math.round(aggregates.avgFinalScore));
        tierEmoji.textContent = tier.emoji;
        tierText.textContent = tier.label;
        tierText.style.color = tier.color;
        cardTier.style.display = 'flex';
      } else if(cardTier){
        cardTier.style.display = 'none';
      }
    }

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
      const footer = card.querySelector('.card-actions');
      card.insertBefore(details, footer || null);
    }

    const reviewsList = details.querySelector('.reviews-list');
    const reviewsToggle = details.querySelector('.reviews-toggle');
    if(!reviewsList || !reviewsToggle) return;

    reviewsList.innerHTML = '';
    const ratings = movie.ratings || {};
    const usernames = Object.keys(ratings);
    const actorKey = getCurrentUserKey();
    const userHasRated = !!(actorKey && ratings[actorKey]);

    if(usernames.length === 0){
      reviewsList.innerHTML = '<p class="no-reviews">No reviews yet</p>';
      reviewsToggle.textContent = 'Individual Reviews';
      return;
    }

    if(!userHasRated){
      reviewsToggle.textContent = 'Individual Reviews (locked)';
      reviewsList.innerHTML = '<p class="no-reviews">Rate this movie to reveal other reviewers.</p>';
      details.removeAttribute('open');
      return;
    }

    reviewsToggle.textContent = `Individual Reviews (${usernames.length})`;
    if(!details.hasAttribute('data-user-toggled')) details.setAttribute('open', '');

    usernames.forEach(username => {
      const userRating = ratings[username];
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'user-review';

      const userTotals = getRatingTotals(userRating);
      const isOwner = username === actorKey;
      const reviewerName = getRatingLabel(movie, username);
      let headerHTML = `<div class="reviewer-header">\n        <strong class="reviewer-name">${reviewerName}</strong>\n        <span class="reviewer-total">B-Movie: ${userTotals.bMovieScore} • Mainstream: ${userTotals.mainstreamScore} • Final: ${userTotals.finalScore > 0 ? '+' : ''}${userTotals.finalScore}</span>`;
      if(isOwner){
        headerHTML += ` <button type="button" class="del-rating-btn" data-user="${sanitize(username)}" title="Delete your rating">✖</button>`;
      }
      headerHTML += '\n      </div>';

      let reviewHTML = `${headerHTML}\n      <div class="reviewer-scores">`;

      CATEGORIES.forEach(cat => {
        const score = userRating[cat.key];
        if(score !== undefined && score !== null){
          const level = cat.levels[score + 5] || '';
          reviewHTML += `<span class="score-item" title="${level}">${cat.icon} ${score > 0 ? '+' + score : score}</span>`;
        }
      });

      BONUS_CATEGORIES.forEach(cat => {
        const score = userRating[cat.key];
        if(score !== undefined && score !== null){
          const level = cat.levels[score + 5] || '';
          reviewHTML += `<span class="score-item bonus" title="${level}">${cat.icon} ${score > 0 ? '+' + score : score}</span>`;
        }
      });

      reviewHTML += '</div>';
      reviewDiv.innerHTML = reviewHTML;
      if(isOwner){
        const btn = reviewDiv.querySelector('.del-rating-btn');
        btn?.addEventListener('click', () => {
          if(confirm('Delete your rating for this movie?')) removeUserRating(movie.id, username);
        });
      }
      reviewsList.appendChild(reviewDiv);
    });

    details.addEventListener('toggle', () => {
      details.setAttribute('data-user-toggled', 'true');
    }, { once: true });
  }

  function getAggregates(movie){
    const userEntries = Object.values(movie.ratings || {});
    const raterCount = userEntries.length;

    let totalBMovieSum = 0;
    let totalMainstreamSum = 0;
    let totalFinalSum = 0;
    const sums = {};
    CATEGORIES.forEach(cat => { sums[cat.key] = 0; });

    userEntries.forEach(entry => {
      CATEGORIES.forEach(cat => {
        const value = Number(entry[cat.key]);
        if(!isNaN(value)) sums[cat.key] += value;
      });
      const totals = getRatingTotals(entry);
      totalBMovieSum += totals.bMovieScore;
      totalMainstreamSum += totals.mainstreamScore;
      totalFinalSum += totals.finalScore;
    });

    const categoryAverages = {};
    CATEGORIES.forEach(cat => {
      categoryAverages[cat.key] = raterCount ? sums[cat.key] / raterCount : NaN;
    });

    const bonusSums = {};
    BONUS_CATEGORIES.forEach(cat => { bonusSums[cat.key] = 0; });
    userEntries.forEach(entry => {
      BONUS_CATEGORIES.forEach(cat => {
        const value = Number(entry[cat.key]);
        if(!isNaN(value)) bonusSums[cat.key] += value;
      });
    });

    const bonusAverages = {};
    BONUS_CATEGORIES.forEach(cat => {
      bonusAverages[cat.key] = raterCount ? bonusSums[cat.key] / raterCount : NaN;
    });

    return {
      raterCount,
      categoryAverages,
      bonusAverages,
      avgBMovieScore: raterCount ? totalBMovieSum / raterCount : 0,
      avgMainstreamScore: raterCount ? totalMainstreamSum / raterCount : 0,
      avgFinalScore: raterCount ? totalFinalSum / raterCount : 0,
      avgPoints: raterCount ? (totalBMovieSum + Math.abs(totalMainstreamSum)) / raterCount : 0,
      avgCheese: raterCount ? totalFinalSum / raterCount : 0
    };
  }

  function refreshVisibleRatings(){
    state.movies.forEach(movie => updateMovieCard(movie.id));
    updateWinnerDropdowns();
  }

  function applyFilters(){
    const sortMode = dom.sort.value;
    const query = dom.search.value.trim().toLowerCase();
    let movies = [...state.movies];

    if(query){
      movies = movies.filter(movie => (
        movie.title.toLowerCase().includes(query) ||
        (movie.notes || '').toLowerCase().includes(query)
      ));
    }

    switch(sortMode){
      case 'title-asc':
        movies.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'ratings-count-desc':
        movies.sort((a, b) => getAggregates(b).raterCount - getAggregates(a).raterCount);
        break;
      case 'total-desc':
        movies.sort((a, b) => (
          getAggregates(b).avgFinalScore - getAggregates(a).avgFinalScore ||
          getAggregates(b).avgBMovieScore - getAggregates(a).avgBMovieScore
        ));
        break;
      case 'added-desc':
      default:
        movies.sort((a, b) => b.addedAt - a.addedAt);
        break;
    }

    const fragment = document.createDocumentFragment();
    movies.forEach(movie => {
      const card = dom.moviesList.querySelector(`.movie-card[data-id="${movie.id}"]`);
      if(card) fragment.appendChild(card);
    });
    dom.moviesList.innerHTML = '';
    dom.moviesList.appendChild(fragment);
    dom.moviesList.classList.toggle('no-results', movies.length === 0);
  }

  function openDialog(movie){
    if(!requireSignedIn('Please sign in with Google before rating movies.')) return;
    activeMovieId = movie.id;
    dom.dialogMovieTitle.textContent = movie.title;
    const actorKey = getCurrentUserKey();
    const prior = actorKey ? movie.ratings[actorKey] : null;
    for(const cat of CATEGORIES){
      dom.rateForm.elements[cat.key].value = prior ? prior[cat.key] : '';
    }
    for(const cat of BONUS_CATEGORIES){
      dom.rateForm.elements[cat.key].value = prior ? prior[cat.key] : '';
    }
    if(typeof dom.rateDialog.showModal === 'function') dom.rateDialog.showModal();
    else dom.rateDialog.setAttribute('open', 'true');
  }

  function closeDialog(){
    activeMovieId = null;
    dom.rateDialog.close?.();
    dom.rateDialog.removeAttribute('open');
    dom.rateForm.reset();
  }

  function initializeMergeDialog(){
    renderMergeDialog();

    dom.openMerge?.addEventListener('click', () => {
      if(!requireSignedIn('Please sign in with Google before merging old scores.')) return;
      renderMergeDialog();
      if(typeof dom.mergeDialog?.showModal === 'function') dom.mergeDialog.showModal();
      else dom.mergeDialog?.setAttribute('open', 'true');
    });

    dom.addMergeCandidate?.addEventListener('click', () => {
      const alias = dom.mergeCandidateSelect?.value || '';
      if(!alias) return;
      if(!mergeState.selectedAliases.includes(alias)){
        mergeState.selectedAliases = [...mergeState.selectedAliases, alias];
      }
      if(dom.mergeCandidateSelect) dom.mergeCandidateSelect.value = '';
      renderMergeDialog();
    });

    dom.closeMerge?.addEventListener('click', () => {
      closeMergeDialog();
    });

    dom.mergeDialog?.addEventListener('click', event => {
      const rect = dom.mergeDialog.getBoundingClientRect();
      if(
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ){
        closeMergeDialog();
      }
    });

    dom.mergeForm?.addEventListener('submit', applyMergeSelection);
  }

  dom.googleSignIn?.addEventListener('click', handleGoogleSignIn);
  dom.signOutBtn?.addEventListener('click', handleSignOut);
  dom.saveDisplayName?.addEventListener('click', handleDisplayNameSave);
  dom.authDisplayName?.addEventListener('keydown', event => {
    if(event.key === 'Enter'){
      event.preventDefault();
      handleDisplayNameSave();
    }
  });

  dom.addForm.addEventListener('submit', event => {
    event.preventDefault();
    const added = addMovieRecordFromDraft(getMovieDraftFromForm());
    if(added) clearAddForm();
  });

  dom.savePendingMovie?.addEventListener('click', saveDraftToPending);

  dom.pendingList?.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if(!button) return;
    const { action, id } = button.dataset;
    if(action === 'edit-notes'){
      openPendingNotesEditor(id || '');
      return;
    }
    if(action === 'save-notes'){
      savePendingNotes(id || '');
      return;
    }
    if(action === 'cancel-notes'){
      closePendingNotesEditor(id || '');
      return;
    }
    if(action === 'add'){
      promotePendingChoice(id || '');
      return;
    }
    if(action === 'remove') removePendingChoice(id || '');
  });

  dom.pendingList?.addEventListener('keydown', event => {
    if(event.key !== 'Enter' || !event.target.classList.contains('pending-notes-input')) return;
    event.preventDefault();
    const card = event.target.closest('.pending-card');
    const choiceId = card?.dataset.id || '';
    if(choiceId) savePendingNotes(choiceId);
  });

  dom.sort?.addEventListener('change', applyFilters);
  dom.search?.addEventListener('input', applyFilters);

  dom.winnerForm?.addEventListener('submit', event => {
    event.preventDefault();
    if(!requireSignedIn('Please sign in with Google before crowning the winner.')) return;
    const movieId = dom.winnerMovie.value;
    const personKey = dom.winnerPerson.value;
    if(!movieId || !personKey){
      alert('Please select both a movie and a person.');
      return;
    }
    setWinner(movieId, personKey);
  });

  dom.clearWinner?.addEventListener('click', clearWinner);
  dom.clearDisplayedWinner?.addEventListener('click', clearWinner);

  dom.saveTheme?.addEventListener('click', () => {
    if(!currentWinner) return;
    const newTheme = dom.editTheme.value.trim();
    currentWinner.nextTheme = newTheme || null;
    currentWinner.nextRules = getEditedWinnerRules();

    const themeEl = dom.winnerDisplay.querySelector('.winner-theme');
    if(currentWinner.nextTheme){
      themeEl.textContent = `Next Theme: ${currentWinner.nextTheme}`;
      themeEl.style.display = 'block';
    } else {
      themeEl.style.display = 'none';
    }

    displayWinner();
    if(dom.winnerEditorDropdown) dom.winnerEditorDropdown.open = false;

    localStorage.setItem('bmovie:winner', JSON.stringify(currentWinner));
    if(remote.enabled && firestore) saveWinnerToFirebase(currentWinner);
  });

  dom.editTheme?.addEventListener('keypress', event => {
    if(event.key === 'Enter') dom.saveTheme?.click();
  });

  dom.rateForm.addEventListener('submit', event => {
    event.preventDefault();
    if(!requireSignedIn('Please sign in with Google before rating a movie.')) return;
    if(!activeMovieId) return;
    const movie = state.movies.find(item => item.id === activeMovieId);
    if(!movie) return;

    const entry = {};
    for(const cat of CATEGORIES){
      const value = parseInt(dom.rateForm.elements[cat.key].value, 10);
      if(isNaN(value) || value < -5 || value > 5){
        alert('All main categories must be scored -5 to 5.');
        return;
      }
      entry[cat.key] = value;
    }

    for(const cat of BONUS_CATEGORIES){
      const value = parseInt(dom.rateForm.elements[cat.key].value, 10);
      if(!isNaN(value) && value >= -5 && value <= 5){
        entry[cat.key] = value;
      }
    }

    const actorKey = getCurrentUserKey();
    ensureMovieShape(movie);
    movie.ratings[actorKey] = entry;
    movie.ratingNames[actorKey] = getCurrentUserName();
    persist();
    updateMovieCard(movie.id);
    updateScoreTracker();
    updateWinnerDropdowns();
    closeDialog();
  });

  dom.rateForm.addEventListener('reset', () => {
    closeDialog();
  });

  dom.rateDialog?.addEventListener('click', event => {
    const rect = dom.rateDialog.getBoundingClientRect();
    if(
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ){
      closeDialog();
    }
  });

  window.addEventListener('keydown', event => {
    if(event.key === 'Escape' && activeMovieId) closeDialog();
  });

  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const bottomNav = document.getElementById('bottomNav');
  const navItems = bottomNav?.querySelectorAll('.nav-item');
  const mobilePanels = document.querySelectorAll('.mobile-panel');

  menuToggle?.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    mobileMenu?.classList.toggle('open');
  });

  document.addEventListener('click', event => {
    if(
      mobileMenu?.classList.contains('open') &&
      !mobileMenu.contains(event.target) &&
      !menuToggle?.contains(event.target)
    ){
      menuToggle?.classList.remove('active');
      mobileMenu?.classList.remove('open');
    }
  });

  function switchToSection(sectionId){
    navItems?.forEach(item => {
      item.classList.toggle('active', item.dataset.section === sectionId);
    });
    mobilePanels?.forEach(panel => {
      panel.classList.toggle('active', panel.id === sectionId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navItems?.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      if(sectionId) switchToSection(sectionId);
    });
  });

  navItems?.forEach(item => {
    item.addEventListener('touchstart', () => {
      item.style.opacity = '0.7';
    }, { passive: true });
    item.addEventListener('touchend', () => {
      item.style.opacity = '1';
    }, { passive: true });
  });

  function debugLocalReason(){
    const reasons = [];
    if(typeof window.FIREBASE_ENABLED === 'undefined') reasons.push('window.FIREBASE_ENABLED undefined (config file not loaded?)');
    else if(!window.FIREBASE_ENABLED) reasons.push('FIREBASE_ENABLED is false');
    if(typeof window.FIREBASE_CONFIG === 'undefined') reasons.push('FIREBASE_CONFIG missing');
    else if(!window.FIREBASE_CONFIG.projectId) reasons.push('FIREBASE_CONFIG.projectId missing');
    if(reasons.length === 0) reasons.push('Firebase init likely failed before enabling remote (see earlier console warnings).');
    console.info('[B-Movie][Sync Debug] Remote disabled reasons:', reasons.join('; '));
    console.info('[B-Movie][Sync Debug] FIREBASE_ENABLED=', window.FIREBASE_ENABLED, 'FIREBASE_CONFIG=', window.FIREBASE_CONFIG);
    console.info('[B-Movie][Sync Debug] Enable Google sign-in in Firebase Authentication and authorize this domain.');
  }

  generateCategoryGrid();
  initializeMergeDialog();
  loadWinner();
  renderAll();
  updateAuthPanel();
  await initFirebase();

  if(!remote.enabled){
    updateSyncStatus('local', 'Local Only');
    debugLocalReason();
  }
})();