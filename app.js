/* B-Movie Ratings App Logic (with Firebase Firestore sync and Google sign-in) */
(async function(){

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
  ].map(category => ({
    // Neutral is the baseline visual group; live averages switch groups by sign.
    scoreGroup: 'neutral',
    ...category
  }));

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
  let nightsCollection = null;
  let unsubscribeMovies = null;
  let unsubscribeNights = null;
  let unsubscribeWinner = null;
  let unsubscribeUserProfile = null;
  let unsubscribePendingChoices = null;
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
  const tmdbWatchCache = new Map();

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

  function getPendingChoicesUpdatedAt(profile){
    return Number(profile?.pendingChoicesUpdatedAt) || 0;
  }

  function normalizePendingChoicesList(list){
    if(!Array.isArray(list)) return [];
    return list
      .map(normalizePendingChoice)
      .filter(choice => choice.title)
      .sort((a, b) => b.addedAt - a.addedAt);
  }

  function normalizePendingChoicesRecord(storedValue){
    if(Array.isArray(storedValue)){
      return {
        choices: normalizePendingChoicesList(storedValue),
        updatedAt: 0
      };
    }

    const choices = normalizePendingChoicesList(storedValue?.choices);
    return {
      choices,
      updatedAt: Number(storedValue?.updatedAt) || 0
    };
  }

  function writePendingChoicesRecord(uid, choices, updatedAt){
    // No local persistence: pending choices live only in Firebase.
  }

  function getPendingChoicesRemoteRecord(value){
    return normalizePendingChoicesRecord(value);
  }

  function setCurrentPendingChoices(uid, choices, updatedAt){
    const normalizedChoices = normalizePendingChoicesList(choices);
    const normalizedUpdatedAt = Number(updatedAt) || 0;
    pendingChoices = normalizedChoices;
    currentUserProfile = {
      ...normalizeUserProfileRecord(currentUserProfile, uid),
      pendingChoices: [...normalizedChoices],
      pendingChoicesUpdatedAt: normalizedUpdatedAt
    };
    writePendingChoicesRecord(uid, normalizedChoices, normalizedUpdatedAt);
    storeUserProfile(uid, currentUserProfile);
  }

  function shouldUseIncomingPendingRecord(activeRecord, incomingRecord){
    const activeUpdatedAt = Number(activeRecord?.updatedAt) || 0;
    const incomingUpdatedAt = Number(incomingRecord?.updatedAt) || 0;
    if(incomingUpdatedAt > activeUpdatedAt) return true;
    if(incomingUpdatedAt < activeUpdatedAt) return false;
    return JSON.stringify(normalizePendingChoicesList(activeRecord?.choices || [])) !==
      JSON.stringify(normalizePendingChoicesList(incomingRecord?.choices || []));
  }

  function normalizeUserProfileRecord(profile, uid){
    const fallbackUid = uid || profile?.uid || '';
    const fallbackDisplayName = sanitize(currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Google User');
    const normalizedPending = normalizePendingChoicesList(profile?.pendingChoices);
    return {
      uid: profile?.uid || fallbackUid,
      displayName: sanitize(profile?.displayName || fallbackDisplayName),
      email: sanitize(profile?.email || currentUser?.email || ''),
      updatedAt: Number(profile?.updatedAt) || 0,
      pendingChoices: normalizedPending,
      pendingChoicesUpdatedAt: Number(profile?.pendingChoicesUpdatedAt) || 0
    };
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
    // No local persistence: pending choices come from Firebase.
    return [];
  }

  function readPendingChoicesRecord(uid){
    // No local persistence: pending choices come from Firebase.
    return { choices: [], updatedAt: 0 };
  }

  function savePendingChoices(){
    const uid = getCurrentUserKey();
    if(!uid) return;
    pendingChoices = normalizePendingChoicesList(pendingChoices);
    const updatedAt = Date.now();
    setCurrentPendingChoices(uid, pendingChoices, updatedAt);

    const baseProfile = normalizeUserProfileRecord(currentUserProfile || {
      uid,
      displayName: getDefaultCurrentUserName(),
      email: currentUser?.email || '',
      updatedAt: Number(currentUserProfile?.updatedAt) || 0,
      pendingChoices,
      pendingChoicesUpdatedAt: updatedAt
    }, uid);

    currentUserProfile = {
      ...baseProfile,
      pendingChoices: [...pendingChoices],
      pendingChoicesUpdatedAt: updatedAt
    };
    storeUserProfile(uid, currentUserProfile);

    if(remote.enabled && firestore){
      writeUserProfileToRemote(uid, currentUserProfile).catch(error => {
        console.warn('[Firebase] Failed to sync pending choices:', error);
      });
      writePendingChoicesToRemote(uid, pendingChoices, updatedAt).catch(error => {
        console.warn('[Firebase] Failed to sync pending choices document:', error);
      });
    }
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
    if(!currentUser){
      pendingChoices = [];
      return;
    }

    const uid = currentUser.uid;
    const localRecord = readPendingChoicesRecord(uid);
    const localChoices = normalizePendingChoicesList(localRecord.choices);
    const localUpdatedAt = Number(localRecord.updatedAt) || 0;

    const profileChoices = normalizePendingChoicesList(currentUserProfile?.pendingChoices || []);
    const profileUpdatedAt = getPendingChoicesUpdatedAt(currentUserProfile);

    if(profileUpdatedAt >= localUpdatedAt){
      setCurrentPendingChoices(uid, profileChoices, profileUpdatedAt);
    } else {
      setCurrentPendingChoices(uid, localChoices, localUpdatedAt);
      if(remote.enabled && firestore){
        writeUserProfileToRemote(uid, currentUserProfile).catch(error => {
          console.warn('[Firebase] Failed to backfill pending choices:', error);
        });
        writePendingChoicesToRemote(uid, pendingChoices, localUpdatedAt).catch(error => {
          console.warn('[Firebase] Failed to backfill pending choices document:', error);
        });
      }
    }
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

    // Auto-group: attach to nearest night within 1 day, creating one if needed.
    const today = todayDateKey();
    let night = findNightByNearestDate(today, 1) || findNightByDate(today);
    if(!night){
      night = createNight({ date: today });
    }
    addMovieToNight(movie.id, night.id);

    persist();
    persistNights();
    updateScoreTracker();
    updateWinnerDropdowns();
    applyFilters();
    return true;
  }

  function getTmdbSearchUrl(title, year){
    const query = sanitize(title || '').trim();
    if(!query) return 'https://www.themoviedb.org/';

    const params = new URLSearchParams({ query });
    const parsedYear = Number(year);
    if(Number.isFinite(parsedYear)) params.set('primary_release_year', String(parsedYear));
    return `https://www.themoviedb.org/search?${params.toString()}`;
  }

  function getTmdbWatchUrl(movieId){
    return `https://www.themoviedb.org/movie/${movieId}/watch`;
  }

  function getTmdbApiKey(){
    return sanitize(window.TMDB_API_KEY || '').trim();
  }

  function getTmdbReadAccessToken(){
    return sanitize(window.TMDB_READ_ACCESS_TOKEN || '').trim();
  }

  async function requestTmdbJson(path, params = {}){
    const apiKey = getTmdbApiKey();
    const readAccessToken = getTmdbReadAccessToken();
    if(!apiKey && !readAccessToken){
      throw new Error('TMDB credentials missing');
    }

    const url = new URL(`https://api.themoviedb.org/3${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if(value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });

    const headers = { Accept: 'application/json' };
    if(readAccessToken){
      headers.Authorization = `Bearer ${readAccessToken}`;
    } else {
      url.searchParams.set('api_key', apiKey);
    }

    const response = await fetch(url.toString(), { headers });
    if(!response.ok) throw new Error(`TMDB request failed (${response.status})`);
    return response.json();
  }

  function getPreferredWatchRegion(){
    const locale = (navigator.language || '').toUpperCase();
    const localeParts = locale.split('-');
    if(localeParts.length > 1 && /^[A-Z]{2}$/.test(localeParts[1])) return localeParts[1];
    return 'US';
  }

  function getPendingWatchCacheKey(choice){
    return `${sanitize(choice?.title || '').toLowerCase()}::${choice?.year || ''}`;
  }

  function extractWatchProviders(providerResult){
    if(!providerResult || typeof providerResult !== 'object') return { stream: [], freeAds: [], rent: [], buy: [] };
    const categoryMap = {
      flatrate: 'stream',
      ads: 'freeAds',
      free: 'freeAds',
      rent: 'rent',
      buy: 'buy'
    };
    const cats = { stream: new Map(), freeAds: new Map(), rent: new Map(), buy: new Map() };
    Object.entries(categoryMap).forEach(([apiKey, cat]) => {
      const list = Array.isArray(providerResult[apiKey]) ? providerResult[apiKey] : [];
      list.forEach(provider => {
        const key = String(provider?.provider_id || provider?.provider_name || '').trim();
        const name = sanitize(provider?.provider_name || '').trim();
        if(!key || !name || cats[cat].has(key)) return;
        cats[cat].set(key, name);
      });
    });
    return {
      stream: Array.from(cats.stream.values()),
      freeAds: Array.from(cats.freeAds.values()),
      rent: Array.from(cats.rent.values()),
      buy: Array.from(cats.buy.values())
    };
  }

  async function fetchPendingWatchInfo(choice){
    const cacheKey = getPendingWatchCacheKey(choice);
    if(tmdbWatchCache.has(cacheKey)) return tmdbWatchCache.get(cacheKey);

    const fallbackSearchUrl = getTmdbSearchUrl(choice.title, choice.year);
    const apiKey = getTmdbApiKey();
    const readAccessToken = getTmdbReadAccessToken();
    if(!apiKey && !readAccessToken){
      const noKeyData = {
        text: 'Add TMDB_API_KEY or TMDB_READ_ACCESS_TOKEN to enable in-app watch providers.',
        linkLabel: 'TMDB Search',
        linkUrl: fallbackSearchUrl
      };
      tmdbWatchCache.set(cacheKey, noKeyData);
      return noKeyData;
    }

    const searchParams = {
      query: sanitize(choice.title || ''),
      include_adult: 'false'
    };
    const parsedYear = Number(choice.year);
    if(Number.isFinite(parsedYear)) searchParams.year = String(parsedYear);

    try {
      const searchPayload = await requestTmdbJson('/search/movie', searchParams);
      const movie = Array.isArray(searchPayload?.results) ? searchPayload.results[0] : null;

      if(!movie?.id){
        const noMatchData = {
          text: 'No TMDB match found yet.',
          linkLabel: 'TMDB Search',
          linkUrl: fallbackSearchUrl
        };
        tmdbWatchCache.set(cacheKey, noMatchData);
        return noMatchData;
      }

      const watchPayload = await requestTmdbJson(`/movie/${movie.id}/watch/providers`);
      const region = getPreferredWatchRegion();
      const regionResult = watchPayload?.results?.[region] || watchPayload?.results?.US || null;
      const cats = extractWatchProviders(regionResult);
      const hasAny = cats.stream.length || cats.freeAds.length || cats.rent.length || cats.buy.length;

      const data = {
        categories: hasAny ? cats : null,
        region,
        text: hasAny ? '' : `No streaming providers listed for ${region} right now.`,
        linkLabel: 'Watch Page',
        linkUrl: getTmdbWatchUrl(movie.id)
      };
      tmdbWatchCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.warn('[TMDB] Watch provider lookup failed:', error);
      const errorData = {
        text: 'Could not load watch providers right now.',
        linkLabel: 'TMDB Search',
        linkUrl: fallbackSearchUrl
      };
      tmdbWatchCache.set(cacheKey, errorData);
      return errorData;
    }
  }

  function buildWatchCategoryHTML(label, names){
    if(!names || !names.length) return '';
    return `<div class="pending-watch-category">
      <span class="pending-watch-cat-label">${label}</span>
      <span class="pending-watch-cat-list">${names.map(n => sanitize(n)).join(', ')}</span>
    </div>`;
  }

  async function renderPendingWatchInfo(choice, watchRow){
    if(!watchRow) return;
    const infoEl = watchRow.querySelector('.pending-watch-info');
    const linkEl = watchRow.querySelector('.pending-watch-link');
    if(!infoEl || !linkEl) return;

    infoEl.textContent = 'Checking watch providers...';
    linkEl.textContent = 'TMDB Search';
    linkEl.href = getTmdbSearchUrl(choice.title, choice.year);

    const data = await fetchPendingWatchInfo(choice);
    if(!watchRow.isConnected) return;

    if(data.categories){
      let html = '';
      html += buildWatchCategoryHTML('Stream', data.categories.stream);
      html += buildWatchCategoryHTML('Free / Ads', data.categories.freeAds);
      html += buildWatchCategoryHTML('Rent', data.categories.rent);
      html += buildWatchCategoryHTML('Buy', data.categories.buy);
      infoEl.innerHTML = html || `No providers listed for ${data.region}.`;
    } else {
      infoEl.textContent = data.text;
    }
    linkEl.textContent = data.linkLabel;
    linkEl.href = data.linkUrl;
  }

  function renderPendingChoices(){
    if(!dom.pendingList || !dom.pendingEmpty || !dom.pendingPanel) return;

    dom.pendingList.innerHTML = '';

    if(!currentUser){
      dom.pendingEmpty.textContent = 'Sign in to save private movie choices and sync them to your account.';
      dom.pendingEmpty.hidden = false;
      return;
    }

    if(!pendingChoices.length){
      dom.pendingEmpty.textContent = 'No pending choices yet. Save one above to keep it private to your account until you are ready to add it.';
      dom.pendingEmpty.hidden = false;
      return;
    }

    dom.pendingEmpty.hidden = true;
    pendingChoices.forEach(choice => {
      const card = document.createElement('article');
      card.className = 'pending-card';
      card.dataset.id = choice.id;

      const safeYear = choice.year || 'Unknown';
      const tmdbUrl = getTmdbSearchUrl(choice.title, choice.year);
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
        <div class="pending-watch" data-watch-id="${choice.id}">
          <span class="pending-watch-info">Checking watch providers...</span>
          <a class="pending-watch-link" href="${tmdbUrl}" target="_blank" rel="noopener noreferrer">TMDB Search</a>
        </div>
        <div class="pending-actions">
          <button type="button" class="btn primary small" data-action="add" data-id="${choice.id}">Add Movie</button>
          <button type="button" class="btn ghost small" data-action="remove" data-id="${choice.id}">Remove</button>
        </div>
      `;

      dom.pendingList.appendChild(card);
      renderPendingWatchInfo(choice, card.querySelector(`.pending-watch[data-watch-id="${choice.id}"]`));
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
    if(!('nightId' in movie)) movie.nightId = null;
    if(movie.nightId && typeof movie.nightId !== 'string') movie.nightId = null;
    return movie;
  }

  function ensureNightShape(night){
    if(!night || typeof night !== 'object') return null;
    const id = sanitize(night.id || createId());
    const name = sanitize(night.name || '').trim();
    const date = sanitize(night.date || '').trim();
    const theme = sanitize(night.theme || '').trim();
    const movieIds = Array.isArray(night.movieIds)
      ? night.movieIds.filter(Boolean).map(value => sanitize(String(value)))
      : [];
    const winnerOverride = night.winnerOverride ? sanitize(String(night.winnerOverride)) : null;
    const createdAt = Number(night.createdAt) || Date.now();
    const updatedAt = Number(night.updatedAt) || createdAt;
    return { id, name, date, theme, movieIds, winnerOverride, createdAt, updatedAt };
  }

  function todayDateKey(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function isValidDateKey(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === (m - 1) && dt.getDate() === d;
  }

  function normalizeDateKeyInput(value){
    const safe = sanitize(value).trim();
    if(isValidDateKey(safe)) return safe;
    if(/^\d{2}-\d{2}-\d{2}$/.test(safe)){
      const [yy, mm, dd] = safe.split('-');
      const expanded = `20${yy}-${mm}-${dd}`;
      if(isValidDateKey(expanded)) return expanded;
    }
    return null;
  }

  function formatDateKeyShort(value){
    if(!isValidDateKey(value)) return sanitize(value || '');
    return value.slice(2);
  }

  function promptForNightDate(initialDate = todayDateKey()){
    const input = prompt(
      'Pick a date for this movie night (YY-MM-DD or YYYY-MM-DD)',
      formatDateKeyShort(initialDate)
    );
    if(input === null) return null;
    const safe = normalizeDateKeyInput(input);
    if(!safe){
      alert('Please enter a valid date in YY-MM-DD or YYYY-MM-DD format.');
      return null;
    }
    return safe;
  }

  function defaultNightName(date){
    return `Movie Night ${date || todayDateKey()}`;
  }

  function getMovieNightDate(movie){
    const night = movie?.nightId ? findNightById(movie.nightId) : null;
    if(night?.date && isValidDateKey(night.date)) return night.date;
    if(Number.isFinite(movie?.addedAt)) return todayDateKeyFromTime(movie.addedAt);
    return '';
  }

  function todayDateKeyFromTime(ms){
    const d = new Date(Number(ms) || Date.now());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function dateKeyToEpochDay(dateKey){
    if(!isValidDateKey(dateKey)) return null;
    const [y, m, d] = dateKey.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  }

  function findNightByNearestDate(date, dayWindow = 1, nights = state.nights){
    const targetDay = dateKeyToEpochDay(date);
    if(targetDay === null) return null;
    let bestNight = null;
    let bestDistance = Infinity;
    nights.forEach(night => {
      const nightDay = dateKeyToEpochDay(night.date);
      if(nightDay === null) return;
      const distance = Math.abs(nightDay - targetDay);
      if(distance > dayWindow) return;
      if(distance < bestDistance){
        bestDistance = distance;
        bestNight = night;
      }
    });
    return bestNight;
  }

  function getMovieTheme(movie){
    const night = movie?.nightId ? findNightById(movie.nightId) : null;
    if(night?.theme) return night.theme;
    return '';
  }

  function buildCardNotesText(movie){
    const chooserLabel = getChooserLabel(movie);
    const segments = [];
    if(chooserLabel) segments.push(`Chosen by: ${chooserLabel}`);
    if(movie.notes) segments.push(movie.notes);

    const dateKey = getMovieNightDate(movie);
    if(dateKey) segments.push(`Date: ${formatDateKeyShort(dateKey)}`);

    const theme = getMovieTheme(movie);
    if(theme) segments.push(`Theme: ${theme}`);

    return segments.join(' • ');
  }

  function normalizeState(value){
    if(!value?.movies) return { movies: [], nights: [] };
    value.movies.forEach(movie => {
      ensureMovieShape(movie);
      delete movie.legacySets;
      delete movie.legacyRatings;
    });
    if(!Array.isArray(value.nights)) value.nights = [];
    value.nights = value.nights.map(ensureNightShape).filter(Boolean);

    // Reconcile cross-references so the two structures cannot drift apart.
    const movieIdSet = new Set(value.movies.map(m => m.id));
    const nightIdSet = new Set(value.nights.map(n => n.id));
    value.nights.forEach(night => {
      night.movieIds = Array.from(new Set(night.movieIds.filter(id => movieIdSet.has(id))));
      if(night.winnerOverride && !night.movieIds.includes(night.winnerOverride)){
        night.winnerOverride = null;
      }
    });
    value.movies.forEach(movie => {
      if(movie.nightId && !nightIdSet.has(movie.nightId)) movie.nightId = null;
      if(movie.nightId){
        const night = value.nights.find(n => n.id === movie.nightId);
        if(night && !night.movieIds.includes(movie.id)) night.movieIds.push(movie.id);
      }
    });
    // Movies referenced by nights but missing nightId get one assigned (first night wins).
    value.nights.forEach(night => {
      night.movieIds.forEach(id => {
        const movie = value.movies.find(m => m.id === id);
        if(movie && movie.nightId !== night.id) movie.nightId = night.id;
      });
    });

    // Auto-group ungrouped movies by nearest night within 1 day.
    // If no night exists yet for that date window, create one on the fly.
    value.movies.forEach(movie => {
      if(movie.nightId) return;
      const movieDate = todayDateKeyFromTime(movie.addedAt);
      const nearbyNight = findNightByNearestDate(movieDate, 1, value.nights);
      const targetNight = nearbyNight || ensureNightShape({
        id: createId(),
        name: defaultNightName(movieDate),
        date: movieDate,
        theme: '',
        movieIds: [],
        winnerOverride: null,
        createdAt: Number(movie.addedAt) || Date.now(),
        updatedAt: Number(movie.addedAt) || Date.now()
      });
      if(!nearbyNight) value.nights.push(targetNight);
      movie.nightId = targetNight.id;
      if(!targetNight.movieIds.includes(movie.id)) targetNight.movieIds.push(movie.id);
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

    const representative = getRepresentativeScore(mainstreamScore, bMovieScore);
    const finalScore = representative.finalScore;
    const pointsTotal = bMovieScore + Math.abs(mainstreamScore);
    const cheeseTotal = finalScore;

    return { bMovieScore, mainstreamScore, finalScore, representativeCategory: representative.category, pointsTotal, cheeseTotal };
  }

  function getRepresentativeScore(mainstreamScore, bMovieScore){
    const mainstreamMagnitude = Math.abs(Number(mainstreamScore) || 0);
    const bMovieMagnitude = Math.abs(Number(bMovieScore) || 0);

    if(bMovieMagnitude >= mainstreamMagnitude){
      return { finalScore: bMovieMagnitude, category: bMovieMagnitude ? 'bmovie' : 'neutral' };
    }
    return { finalScore: -mainstreamMagnitude, category: 'mainstream' };
  }

  function formatSignedScore(value){
    const numericValue = Math.abs(Number(value) || 0);
    if(numericValue > 0) return numericValue.toFixed(1).replace(/\.0$/, '');
    return '0';
  }

  // Movie cards display clean magnitudes while the saved signed values still drive totals.
  function displayScore(value){
    return Math.abs(Number(value) || 0).toFixed(1);
  }

  function getScoreChipGroup(value, fallbackGroup = 'neutral'){
    const numericValue = Number(value);
    if(Number.isFinite(numericValue)){
      if(numericValue > 0) return 'bmovie';
      if(numericValue < 0) return 'mainstream';
      return 'neutral';
    }
    return fallbackGroup;
  }

  function getScoreGroupLabel(scoreGroup){
    if(scoreGroup === 'bmovie') return 'B-Movie';
    if(scoreGroup === 'mainstream') return 'Mainstream';
    return 'Neutral';
  }

  function getDisplayedFormulaTotals(totals){
    const bMovieTotal = Number(displayScore(totals?.bMovieScore));
    const mainstreamTotal = Number(displayScore(totals?.mainstreamScore));
    const representative = getRepresentativeScore(totals?.mainstreamScore, totals?.bMovieScore);
    return {
      bMovieTotal,
      mainstreamTotal,
      finalScore: representative.finalScore,
      representativeCategory: representative.category
    };
  }

  function createScoreChip(cat, isBonus = false){
    const chip = document.createElement('span');
    chip.className = `cat-badge score-chip score-chip-neutral${isBonus ? ' bonus' : ''}`;
    chip.dataset.cat = cat.key;
    chip.dataset.group = cat.scoreGroup || 'neutral';
    chip.dataset.empty = 'true';

    const icon = document.createElement('span');
    icon.className = 'score-chip-icon';
    icon.textContent = cat.icon;
    icon.setAttribute('aria-hidden', 'true');

    const value = document.createElement('span');
    value.className = 'score-chip-value';
    value.textContent = '–';

    chip.append(icon, value);
    return chip;
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
    dom.googleSignIn.hidden = stateName !== 'signed-out';
    dom.signOutBtn.hidden = stateName !== 'signed-in';
    if(dom.openMerge) dom.openMerge.hidden = !(stateName === 'signed-in' && getLegacyMergeCandidates().length > 0);
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

  async function applyAuthUserState(user){
    currentUser = user || null;

    if(!currentUser){
      if(unsubscribeUserProfile) unsubscribeUserProfile();
      if(unsubscribePendingChoices) unsubscribePendingChoices();
      unsubscribeUserProfile = null;
      unsubscribePendingChoices = null;
      currentUserProfile = null;
      pendingChoices = [];
      mergeState.selectedAliases = [];
      closeMergeDialog();
      renderAll();
      return;
    }

    await loadCurrentUserProfile(currentUser.uid);
    propagateCurrentUserName(getCurrentUserName());
    attachUserProfileListener(currentUser.uid);
    attachPendingChoicesListener(currentUser.uid);
    loadPendingChoices();
    renderAll();
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
      const result = await authApi.signInWithPopup(authApi.instance, authApi.provider);
      if(result?.user){
        await applyAuthUserState(result.user);
      }
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
    // No local persistence: the user profile comes from Firebase.
    return null;
  }

  function storeUserProfile(uid, profile){
    // No local persistence: the user profile lives only in Firebase.
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

  async function writePendingChoicesToRemote(uid, choices, updatedAt){
    if(!remote.enabled || !firestore || !uid) return;
    const pendingCollection = remote.collection(firestore, 'bmovie_pending_choices');
    const pendingDoc = remote.doc(pendingCollection, uid);
    await remote.setDoc(pendingDoc, {
      choices: normalizePendingChoicesList(choices),
      updatedAt: Number(updatedAt) || 0
    });
  }

  async function loadRemotePendingChoices(uid, fallbackRecord){
    const safeFallback = getPendingChoicesRemoteRecord(fallbackRecord);
    if(!remote.enabled || !firestore || !uid) return safeFallback;

    try {
      const pendingCollection = remote.collection(firestore, 'bmovie_pending_choices');
      const pendingDoc = remote.doc(pendingCollection, uid);
      const docSnap = await remote.getDoc(pendingDoc);
      if(docSnap.exists()) return getPendingChoicesRemoteRecord(docSnap.data());
    } catch (error) {
      console.warn('[Firebase] Failed to load pending choices document:', error);
    }

    return safeFallback;
  }

  async function loadCurrentUserProfile(uid){
    const localRecord = normalizeUserProfileRecord(readStoredUserProfile(uid), uid);
    currentUserProfile = localRecord;

    if(!remote.enabled || !firestore || !uid){
      pendingChoices = normalizePendingChoicesList(currentUserProfile.pendingChoices);
      writePendingChoicesRecord(uid, pendingChoices, getPendingChoicesUpdatedAt(currentUserProfile));
      return currentUserProfile;
    }

    try {
      const usersCollection = remote.collection(firestore, 'bmovie_users');
      const userDoc = remote.doc(usersCollection, uid);
      const [docSnap, remotePendingRecord] = await Promise.all([
        remote.getDoc(userDoc),
        loadRemotePendingChoices(uid, {
          choices: localRecord.pendingChoices,
          updatedAt: getPendingChoicesUpdatedAt(localRecord)
        })
      ]);
      const remoteRecord = normalizeUserProfileRecord(docSnap.exists() ? docSnap.data() : null, uid);

      const newestIdentity = pickNewestProfile(localRecord, remoteRecord);
      const localPendingUpdatedAt = getPendingChoicesUpdatedAt(localRecord);
      const remotePendingUpdatedAt = getPendingChoicesUpdatedAt(remoteRecord);
      const dedicatedPendingUpdatedAt = Number(remotePendingRecord.updatedAt) || 0;
      const newestPendingRecord = [
        { choices: localRecord.pendingChoices, updatedAt: localPendingUpdatedAt },
        { choices: remoteRecord.pendingChoices, updatedAt: remotePendingUpdatedAt },
        remotePendingRecord
      ].reduce((latest, record) => {
        return shouldUseIncomingPendingRecord(latest, record) ? record : latest;
      }, { choices: [], updatedAt: 0 });

      currentUserProfile = {
        ...newestIdentity,
        uid,
        email: currentUser?.email || newestIdentity.email || '',
        pendingChoices: [...normalizePendingChoicesList(newestPendingRecord.choices)],
        pendingChoicesUpdatedAt: Number(newestPendingRecord.updatedAt) || 0
      };

      setCurrentPendingChoices(uid, currentUserProfile.pendingChoices, currentUserProfile.pendingChoicesUpdatedAt);
      storeUserProfile(uid, currentUserProfile);

      if(
        getProfileUpdatedAt(currentUserProfile) > getProfileUpdatedAt(remoteRecord) ||
        getPendingChoicesUpdatedAt(currentUserProfile) > getPendingChoicesUpdatedAt(remoteRecord)
      ){
        await writeUserProfileToRemote(uid, currentUserProfile);
      }

      if((Number(currentUserProfile.pendingChoicesUpdatedAt) || 0) > dedicatedPendingUpdatedAt){
        await writePendingChoicesToRemote(uid, currentUserProfile.pendingChoices, currentUserProfile.pendingChoicesUpdatedAt);
      }
    } catch (error) {
      console.warn('[Firebase] Failed to load user profile:', error);
    }

    setCurrentPendingChoices(uid, currentUserProfile.pendingChoices, getPendingChoicesUpdatedAt(currentUserProfile));

    return currentUserProfile;
  }

  async function saveCurrentUserProfile(displayName){
    const uid = getCurrentUserKey();
    if(!uid) return;
    currentUserProfile = {
      ...normalizeUserProfileRecord(currentUserProfile, uid),
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

          const remoteProfile = normalizeUserProfileRecord(docSnap.data(), uid);
          const activeProfile = normalizeUserProfileRecord(currentUserProfile || readStoredUserProfile(uid), uid);

          const activeUpdatedAt = getProfileUpdatedAt(activeProfile);
          const remoteUpdatedAt = getProfileUpdatedAt(remoteProfile);
          const activePendingUpdatedAt = getPendingChoicesUpdatedAt(activeProfile);
          const remotePendingUpdatedAt = getPendingChoicesUpdatedAt(remoteProfile);

          const mergedIdentity = pickNewestProfile(activeProfile, remoteProfile);
          const useActivePending = activePendingUpdatedAt >= remotePendingUpdatedAt;
          const mergedProfile = {
            ...mergedIdentity,
            uid,
            email: currentUser?.email || mergedIdentity.email || '',
            pendingChoices: useActivePending ? [...activeProfile.pendingChoices] : [...remoteProfile.pendingChoices],
            pendingChoicesUpdatedAt: useActivePending ? activePendingUpdatedAt : remotePendingUpdatedAt
          };

          const shouldWriteRemote =
            activeUpdatedAt > remoteUpdatedAt ||
            activePendingUpdatedAt > remotePendingUpdatedAt;

          if(shouldWriteRemote){
            await writeUserProfileToRemote(uid, mergedProfile);
          }

          const activePendingSerialized = JSON.stringify(normalizePendingChoicesList(activeProfile.pendingChoices));
          const mergedPendingSerialized = JSON.stringify(normalizePendingChoicesList(mergedProfile.pendingChoices));
          const shouldApplyLocal =
            remoteUpdatedAt > activeUpdatedAt ||
            remotePendingUpdatedAt > activePendingUpdatedAt ||
            activePendingSerialized !== mergedPendingSerialized;

          if(shouldApplyLocal){
            currentUserProfile = mergedProfile;
            setCurrentPendingChoices(uid, mergedProfile.pendingChoices, mergedProfile.pendingChoicesUpdatedAt);
            storeUserProfile(uid, currentUserProfile);
            propagateCurrentUserName(getCurrentUserName());
            renderAll();
            if(currentWinner) displayWinner();
          }

          if(remotePendingUpdatedAt > activePendingUpdatedAt){
            writePendingChoicesToRemote(uid, remoteProfile.pendingChoices, remotePendingUpdatedAt).catch(error => {
              console.warn('[Firebase] Failed to backfill pending choices document from profile listener:', error);
            });
          }
        },
        error => console.warn('[Firebase] User profile listener error:', error)
      );
    } catch (error) {
      console.warn('[Firebase] Failed to attach user profile listener:', error);
    }
  }

  function attachPendingChoicesListener(uid){
    if(!remote.enabled || !firestore || !uid) return;
    if(unsubscribePendingChoices) unsubscribePendingChoices();

    try {
      const pendingCollection = remote.collection(firestore, 'bmovie_pending_choices');
      const pendingDoc = remote.doc(pendingCollection, uid);
      unsubscribePendingChoices = remote.onSnapshot(
        pendingDoc,
        docSnap => {
          if(!docSnap.exists()) return;

          const remoteRecord = getPendingChoicesRemoteRecord(docSnap.data());
          const activeRecord = {
            choices: normalizePendingChoicesList(currentUserProfile?.pendingChoices || readPendingChoicesRecord(uid).choices),
            updatedAt: getPendingChoicesUpdatedAt(currentUserProfile) || readPendingChoicesRecord(uid).updatedAt
          };

          if(!shouldUseIncomingPendingRecord(activeRecord, remoteRecord)) return;

          setCurrentPendingChoices(uid, remoteRecord.choices, remoteRecord.updatedAt);
          renderAll();
          if(currentWinner) displayWinner();
        },
        error => console.warn('[Firebase] Pending choices listener error:', error)
      );
    } catch (error) {
      console.warn('[Firebase] Failed to attach pending choices listener:', error);
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
    // Firebase is the single source of truth. Start empty and let the
    // Firestore listeners populate movies/nights in real time.
    return { movies: [], nights: [] };
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
      chooserName: movie.chooserName || movie.chooser || '',
      nightId: movie.nightId || null
    };
  }

  function sanitizeNightForFirestore(night){
    return {
      id: night.id,
      name: night.name || '',
      date: night.date || '',
      theme: night.theme || '',
      movieIds: Array.isArray(night.movieIds) ? [...night.movieIds] : [],
      winnerOverride: night.winnerOverride || null,
      createdAt: Number(night.createdAt) || Date.now(),
      updatedAt: Number(night.updatedAt) || Date.now()
    };
  }

  // ====== Movie Night CRUD =====================================================
  function findNightById(id){
    if(!id) return null;
    return state.nights.find(n => n.id === id) || null;
  }

  function findNightByDate(date){
    if(!date) return null;
    return state.nights.find(n => n.date === date) || null;
  }

  function createNight({ date, name, theme, movieIds = [], winnerOverride = null } = {}){
    const safeDate = (date || todayDateKey()).trim();
    const safeName = (name || '').trim() || defaultNightName(safeDate);
    const safeTheme = sanitize(theme || currentWinner?.nextTheme || '').trim();
    const now = Date.now();
    const night = ensureNightShape({
      id: createId(),
      name: safeName,
      date: safeDate,
      theme: safeTheme,
      movieIds: [...movieIds],
      winnerOverride,
      createdAt: now,
      updatedAt: now
    });
    state.nights.push(night);
    movieIds.forEach(mid => {
      const m = state.movies.find(item => item.id === mid);
      if(m) m.nightId = night.id;
    });
    return night;
  }

  function addMovieToNight(movieId, nightId){
    const movie = state.movies.find(m => m.id === movieId);
    if(!movie) return;
    if(movie.nightId && movie.nightId !== nightId){
      const oldNight = findNightById(movie.nightId);
      if(oldNight){
        oldNight.movieIds = oldNight.movieIds.filter(id => id !== movieId);
        if(oldNight.winnerOverride === movieId) oldNight.winnerOverride = null;
        oldNight.updatedAt = Date.now();
      }
    }
    movie.nightId = nightId || null;
    if(nightId){
      const night = findNightById(nightId);
      if(night && !night.movieIds.includes(movieId)){
        night.movieIds.push(movieId);
        night.updatedAt = Date.now();
      }
    }
  }

  function removeMovieFromNight(movieId){
    addMovieToNight(movieId, null);
  }

  function renameNight(nightId, name){
    const night = findNightById(nightId);
    if(!night) return;
    night.name = sanitize(name).trim() || defaultNightName(night.date);
    night.updatedAt = Date.now();
  }

  function setNightDate(nightId, date){
    const night = findNightById(nightId);
    if(!night) return;
    const safeDate = sanitize(date).trim();
    if(!isValidDateKey(safeDate)) return;
    const wasDefaultName = night.name === defaultNightName(night.date);
    night.date = safeDate;
    if(wasDefaultName) night.name = defaultNightName(night.date);
    night.updatedAt = Date.now();
  }

  function setNightWinnerOverride(nightId, movieId){
    const night = findNightById(nightId);
    if(!night) return;
    night.winnerOverride = movieId && night.movieIds.includes(movieId) ? movieId : null;
    night.updatedAt = Date.now();
  }

  function setNightTheme(nightId, theme){
    const night = findNightById(nightId);
    if(!night) return;
    night.theme = sanitize(theme || '').trim();
    night.updatedAt = Date.now();
  }

  function deleteNight(nightId){
    const night = findNightById(nightId);
    if(!night) return null;
    night.movieIds.forEach(mid => {
      const m = state.movies.find(item => item.id === mid);
      if(m) m.nightId = null;
    });
    state.nights = state.nights.filter(n => n.id !== nightId);
    return night;
  }

  function getNightWinner(night){
    if(!night) return null;
    const movies = night.movieIds
      .map(id => state.movies.find(m => m.id === id))
      .filter(Boolean);
    if(night.winnerOverride){
      const overrideMovie = movies.find(m => m.id === night.winnerOverride);
      if(overrideMovie) return overrideMovie;
    }
    let best = null;
    let bestAbs = -1;
    let bestRaters = -1;
    let bestAdded = Infinity;
    for(const m of movies){
      const agg = getAggregates(m);
      if(!agg.raterCount) continue;
      const abs = Math.abs(agg.avgFinalScore);
      const raters = agg.raterCount;
      const added = m.addedAt || 0;
      const better = (
        abs > bestAbs ||
        (abs === bestAbs && raters > bestRaters) ||
        (abs === bestAbs && raters === bestRaters && added < bestAdded)
      );
      if(better){
        best = m;
        bestAbs = abs;
        bestRaters = raters;
        bestAdded = added;
      }
    }
    return best;
  }

  function persistNights(){
    if(!remote.enabled || !nightsCollection) return;
    state.nights.forEach(night => {
      remote
        .setDoc(remote.doc(nightsCollection, night.id), sanitizeNightForFirestore(night))
        .catch(error => console.warn('[Firebase] night write fail', error));
    });
  }

  function deleteNightFromRemote(nightId){
    if(!remote.enabled || !nightsCollection || !nightId) return;
    remote.deleteDoc(remote.doc(nightsCollection, nightId)).catch(error => {
      console.warn('[Firebase] night delete fail', error);
    });
  }

  function attachNightsListener(){
    if(!remote.enabled || !nightsCollection) return;
    if(unsubscribeNights) unsubscribeNights();
    unsubscribeNights = remote.onSnapshot(
      nightsCollection,
      snapshot => {
        const remoteNights = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const shaped = ensureNightShape(data);
          if(shaped) remoteNights.push(shaped);
        });
        mergeRemoteNights(remoteNights);
      },
      error => console.warn('[Firebase] nights listener error', error)
    );
  }

  function mergeRemoteNights(remoteNights){
    const map = new Map(state.nights.map(n => [n.id, n]));
    remoteNights.forEach(remoteNight => {
      const existing = map.get(remoteNight.id);
      if(!existing || (remoteNight.updatedAt || 0) >= (existing.updatedAt || 0)){
        map.set(remoteNight.id, remoteNight);
      }
    });
    const remoteIds = new Set(remoteNights.map(n => n.id));
    // Drop nights that exist locally but the remote no longer reports (only if remote is authoritative).
    Array.from(map.keys()).forEach(id => {
      if(!remoteIds.has(id) && remoteNights.length > 0){
        const local = map.get(id);
        // Keep local-only nights that were just created (no remote echo yet).
        if(local && (Date.now() - (local.updatedAt || 0)) > 5000){
          map.delete(id);
        }
      }
    });
    state.nights = Array.from(map.values());
    state = normalizeState(state); // re-reconciles movie.nightId <-> night.movieIds
    scheduleRender();
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
      nightsCollection = collection(firestore, 'bmovie_nights');
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
      attachNightsListener();
      attachWinnerListener();
      await loadRemoteWinner();

      onAuthStateChanged(auth, async user => {
        await applyAuthUserState(user);
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
      updateSyncStatus('error', 'Disconnected');
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
    // Firebase is authoritative: the snapshot is the complete set of movies.
    // Firestore latency compensation echoes local writes immediately, so
    // optimistic adds/edits still appear without any local persistence.
    state.movies = remoteMovies
      .map(ensureMovieShape)
      .sort((a, b) => b.addedAt - a.addedAt);
    state = normalizeState(state); // reconcile movie.nightId <-> night.movieIds
    scheduleRender();
  }

  function persist(){
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
    // No-op: the current winner is loaded from Firebase via loadRemoteWinner()
    // and kept in sync in real time by attachWinnerListener().
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
            <div class="tracker-stat-bottom">
              <strong class="tracker-stat-value">${formatSignedScore(scorer.totalBMovieScore)}</strong>
              <span class="tracker-stat-subtle">Avg ${formatSignedScore(scorer.avgBMovieScore)}</span>
            </div>
          </div>
          <div class="tracker-stat tracker-stat-mainstream">
            <span class="tracker-stat-label">Mainstream</span>
            <div class="tracker-stat-bottom">
              <strong class="tracker-stat-value">${formatSignedScore(scorer.totalMainstreamScore)}</strong>
              <span class="tracker-stat-subtle">Avg ${formatSignedScore(scorer.avgMainstreamScore)}</span>
            </div>
          </div>
        </div>
      `;
      scoreItem.title = `${scorer.label}: B-Movie ${formatSignedScore(scorer.totalBMovieScore)}, Mainstream ${formatSignedScore(scorer.totalMainstreamScore)} across ${scorer.movieCount} qualified movie(s). Avg B-Movie ${formatSignedScore(scorer.avgBMovieScore)}, Avg Mainstream ${formatSignedScore(scorer.avgMainstreamScore)}.`;
      dom.trackerScores.appendChild(scoreItem);
    });
  }

  function renderAll(){
    renderPendingChoices();
    updateWinnerDropdowns();
    updateScoreTracker();
    applyFilters();
    updateAuthPanel();
  }

  // Coalesce bursts of snapshot-driven renders (e.g. multiple Firestore writes
  // echoing back) into a single repaint so the list doesn't flicker.
  let renderScheduled = false;
  function scheduleRender(){
    if(renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      renderAll();
    });
  }

  function editNightFromMovie(movie){
    if(!requireSignedIn('Please sign in with Google before editing nights.')) return;
    ensureMovieShape(movie);

    const currentNight = movie.nightId ? findNightById(movie.nightId) : null;
    const baseDate = currentNight?.date || todayDateKeyFromTime(movie.addedAt);
    const pickedDate = promptForNightDate(baseDate || todayDateKey());
    if(!pickedDate) return;

    let targetNight = findNightByNearestDate(pickedDate, 1) || findNightByDate(pickedDate);
    if(!targetNight){
      targetNight = createNight({
        date: pickedDate,
        theme: currentNight?.theme || ''
      });
    }

    addMovieToNight(movie.id, targetNight.id);

    const nextTheme = prompt(
      'Theme for this night (optional). Press Cancel to keep unchanged.',
      targetNight.theme || ''
    );
    if(nextTheme !== null){
      setNightTheme(targetNight.id, nextTheme);
    }

    persist();
    persistNights();
    applyFilters();
    updateWinnerDropdowns();
    updateScoreTracker();
  }

  function renderMovie(movie){
    ensureMovieShape(movie);
    const clone = dom.template.content.firstElementChild.cloneNode(true);
    clone.dataset.id = movie.id;
    clone.querySelector('.movie-title').textContent = movie.title;
    clone.querySelector('.year').textContent = movie.year || '';

    const notesEl = clone.querySelector('.notes');
    notesEl.textContent = buildCardNotesText(movie);

    const catRow = clone.querySelector('.score-row.categories');
    for(const cat of CATEGORIES){
      const chip = createScoreChip(cat);
      chip.title = `${cat.label} • ${getScoreGroupLabel(cat.scoreGroup)} group`;
      chip.setAttribute('aria-label', `${cat.label} score`);
      catRow.appendChild(chip);
    }

    for(const cat of BONUS_CATEGORIES){
      const chip = createScoreChip(cat, true);
      chip.title = `${cat.label} • ${getScoreGroupLabel(cat.scoreGroup)} group (bonus - not counted in total)`;
      chip.setAttribute('aria-label', `${cat.label} bonus score`);
      catRow.appendChild(chip);
    }

    clone.querySelector('.open-rate').addEventListener('click', () => openDialog(movie));

    // Night edit control on the card footer.
    const cardActions = clone.querySelector('.card-actions');
    if(cardActions){
      const editNightBtn = document.createElement('button');
      editNightBtn.type = 'button';
      editNightBtn.className = 'btn ghost small edit-night-btn';
      editNightBtn.title = 'Edit night date and theme';
      editNightBtn.setAttribute('aria-label', 'Edit this movie night date and theme');
      editNightBtn.textContent = 'Edit';
      editNightBtn.addEventListener('click', () => editNightFromMovie(movie));
      cardActions.insertBefore(editNightBtn, cardActions.firstChild);
    }

    clone.querySelector('.delete-btn').addEventListener('click', () => {
      if(!requireSignedIn('Please sign in with Google before deleting a movie.')) return;
      if(!confirm('Delete this movie?')) return;
      removeMovieFromNight(movie.id);
      state.movies = state.movies.filter(item => item.id !== movie.id);
      // Only the removed movie and its night changed. Deleting the doc and
      // persisting the night is enough; rewriting every movie would cause a
      // burst of snapshot echoes and make the list flicker.
      persistNights();
      if(remote.enabled && moviesCollection){
        remote.deleteDoc(remote.doc(moviesCollection, movie.id)).catch(error => {
          console.warn('[Firebase] delete fail', error);
        });
      }
      applyFilters();
      updateWinnerDropdowns();
      updateScoreTracker();
    });

    updateCardScores(movie, clone);
    updateIndividualReviews(movie, clone);

    return clone;
  }

  function updateMovieCard(id){
    const movie = state.movies.find(item => item.id === id);
    if(!movie) return;
    const card = dom.moviesList.querySelector(`.movie-card[data-id="${id}"]`);
    if(card){
      const notesEl = card.querySelector('.notes');
      notesEl.textContent = buildCardNotesText(movie);
      updateCardScores(movie, card);
      updateIndividualReviews(movie, card);
    }
  }

  function updateCardScores(movie, card){
    const aggregates = getAggregates(movie);
    const raterCount = aggregates.raterCount;

    for(const cat of CATEGORIES){
      const badge = card.querySelector(`.cat-badge[data-cat="${cat.key}"]`);
      if(!badge) continue;
      const valueEl = badge.querySelector('.score-chip-value');
      const avg = aggregates.categoryAverages[cat.key];
      const scoreGroup = getScoreChipGroup(avg, cat.scoreGroup);
      if(valueEl) valueEl.textContent = Number.isFinite(avg) ? displayScore(avg) : '–';
      badge.title = `${cat.label} • ${getScoreGroupLabel(scoreGroup)} group`;
      badge.dataset.empty = Number.isFinite(avg) ? 'false' : 'true';
      badge.dataset.locked = 'false';
      badge.dataset.group = scoreGroup;
      badge.className = `cat-badge score-chip score-chip-${scoreGroup}`;
      badge.setAttribute(
        'aria-label',
        Number.isFinite(avg)
          ? `${cat.label} ${displayScore(avg)} in the ${getScoreGroupLabel(scoreGroup)} group`
          : `${cat.label} score not rated yet`
      );
    }

    for(const cat of BONUS_CATEGORIES){
      const badge = card.querySelector(`.cat-badge[data-cat="${cat.key}"]`);
      if(!badge) continue;
      const valueEl = badge.querySelector('.score-chip-value');
      const avg = aggregates.bonusAverages[cat.key];
      const scoreGroup = getScoreChipGroup(avg, cat.scoreGroup);
      if(valueEl) valueEl.textContent = Number.isFinite(avg) ? displayScore(avg) : '–';
      badge.title = `${cat.label} • ${getScoreGroupLabel(scoreGroup)} group (bonus - not counted in total)`;
      badge.dataset.empty = Number.isFinite(avg) ? 'false' : 'true';
      badge.dataset.locked = 'false';
      badge.dataset.group = scoreGroup;
      badge.className = `cat-badge score-chip score-chip-${scoreGroup} bonus`;
    }

    const bMovieEl = card.querySelector('.bmovie-val');
    const mainstreamEl = card.querySelector('.mainstream-val');
    const finalEl = card.querySelector('.final-val');
    const finalBlock = card.querySelector('.formula-block-final');
    const raterEl = card.querySelector('.rater-count');
    const tierEmoji = card.querySelector('.tier-emoji');
    const tierText = card.querySelector('.tier-text');
    const cardTier = card.querySelector('.card-tier');

    if(finalBlock){
      finalBlock.classList.remove('is-mainstream', 'is-bmovie', 'is-neutral');
    }

    {
      const bMovieTotal = raterCount ? Number(displayScore(aggregates.avgBMovieScore)) : 0;
      const mainstreamTotal = raterCount ? Number(displayScore(aggregates.avgMainstreamScore)) : 0;
      const finalScore = aggregates.avgFinalScore;

      if(bMovieEl) bMovieEl.textContent = bMovieTotal.toFixed(1);
      if(mainstreamEl) mainstreamEl.textContent = mainstreamTotal.toFixed(1);
      if(finalEl) finalEl.textContent = finalScore.toFixed(1);
      if(finalBlock){
        if(finalScore < 0) finalBlock.classList.add('is-mainstream');
        else if(finalScore > 0) finalBlock.classList.add('is-bmovie');
        else finalBlock.classList.add('is-neutral');
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
    if(lockMsg) lockMsg.remove();
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

    if(usernames.length === 0){
      reviewsList.innerHTML = '<p class="no-reviews">No reviews yet</p>';
      reviewsToggle.textContent = 'Individual Reviews';
      return;
    }

    reviewsToggle.textContent = `Individual Reviews (${usernames.length})`;
    if(!details.hasAttribute('data-user-toggled')) details.removeAttribute('open');

    usernames.forEach(username => {
      const userRating = ratings[username];
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'user-review';

      const userTotals = getRatingTotals(userRating);
      const displayTotals = getDisplayedFormulaTotals(userTotals);
      const isOwner = username === actorKey;
      const reviewerName = getRatingLabel(movie, username);
      let headerHTML = `<div class="reviewer-header">\n        <div class="reviewer-summary">\n          <div class="reviewer-topline" aria-label="Final Score equals Mainstream Score minus B-Movie Score">\n            <strong class="reviewer-name">${reviewerName}</strong>\n            <div class="reviewer-total">\n              <span class="review-total-pill review-total-pill-mainstream">\n                <span class="review-total-label">Mainstream</span>\n                <strong class="review-total-value">${displayTotals.mainstreamTotal.toFixed(1)}</strong>\n              </span>\n              <span class="review-total-operator">minus</span>\n              <span class="review-total-pill review-total-pill-bmovie">\n                <span class="review-total-label">B-Movie</span>\n                <strong class="review-total-value">${displayTotals.bMovieTotal.toFixed(1)}</strong>\n              </span>\n              <span class="review-total-operator">equals</span>\n              <span class="review-total-pill review-total-pill-final reviewer-final-pill">\n                <span class="review-total-label">Final</span>\n                <strong class="review-total-value">${displayTotals.finalScore.toFixed(1)}</strong>\n              </span>\n            </div>\n          </div>\n        </div>`;
      if(isOwner){
        headerHTML += ` <button type="button" class="del-rating-btn" data-user="${sanitize(username)}" title="Delete your rating">✖</button>`;
      }
      headerHTML = headerHTML
        .replace('Final Score equals Mainstream Score minus B-Movie Score', 'Representative Score is the higher average of AAA Mainstream and B-Movie scores')
        .replace('>minus</span>', '>or</span>')
        .replace('>equals</span>', '>wins</span>');
      headerHTML += '\n      </div>';

      let reviewHTML = `${headerHTML}\n      <div class="reviewer-scores">`;

      CATEGORIES.forEach(cat => {
        const score = userRating[cat.key];
        if(score !== undefined && score !== null){
          const level = cat.levels[score + 5] || '';
          const scoreGroup = getScoreChipGroup(score, cat.scoreGroup);
          reviewHTML += `<span class="score-item score-item-${scoreGroup}" title="${level}" aria-label="${cat.label} ${displayScore(score)} in the ${getScoreGroupLabel(scoreGroup)} group"><span class="score-item-icon" aria-hidden="true">${cat.icon}</span><span class="score-item-value">${displayScore(score)}</span></span>`;
        }
      });

      BONUS_CATEGORIES.forEach(cat => {
        const score = userRating[cat.key];
        if(score !== undefined && score !== null){
          const level = cat.levels[score + 5] || '';
          const scoreGroup = getScoreChipGroup(score, cat.scoreGroup);
          reviewHTML += `<span class="score-item score-item-${scoreGroup} bonus" title="${level}" aria-label="${cat.label} ${displayScore(score)} in the ${getScoreGroupLabel(scoreGroup)} group"><span class="score-item-icon" aria-hidden="true">${cat.icon}</span><span class="score-item-value">${displayScore(score)}</span></span>`;
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

    const representative = getRepresentativeScore(
      raterCount ? totalMainstreamSum / raterCount : 0,
      raterCount ? totalBMovieSum / raterCount : 0
    );

    return {
      raterCount,
      categoryAverages,
      bonusAverages,
      avgBMovieScore: raterCount ? totalBMovieSum / raterCount : 0,
      avgMainstreamScore: raterCount ? totalMainstreamSum / raterCount : 0,
      avgFinalScore: representative.finalScore,
      representativeCategory: representative.category,
      avgPoints: raterCount ? (totalBMovieSum + Math.abs(totalMainstreamSum)) / raterCount : 0,
      avgCheese: representative.finalScore
    };
  }

  function refreshVisibleRatings(){
    state.movies.forEach(movie => updateMovieCard(movie.id));
    updateWinnerDropdowns();
  }

  function applyFilters(){
    const sortMode = dom.sort.value || 'night-grouped';
    const query = dom.search.value.trim().toLowerCase();
    let movies = [...state.movies];

    if(query){
      movies = movies.filter(movie => (
        movie.title.toLowerCase().includes(query) ||
        (movie.notes || '').toLowerCase().includes(query)
      ));
    }

    let sortFn;
    switch(sortMode){
      case 'title-asc':
        sortFn = (a, b) => a.title.localeCompare(b.title);
        break;
      case 'ratings-count-desc':
        sortFn = (a, b) => getAggregates(b).raterCount - getAggregates(a).raterCount;
        break;
      case 'total-desc':
        sortFn = (a, b) => (
          getAggregates(b).avgFinalScore - getAggregates(a).avgFinalScore ||
          getAggregates(b).avgBMovieScore - getAggregates(a).avgBMovieScore
        );
        break;
      case 'added-desc':
        sortFn = (a, b) => b.addedAt - a.addedAt;
        break;
      case 'night-grouped':
      default:
        sortFn = (a, b) => b.addedAt - a.addedAt;
        break;
    }
    movies.sort(sortFn);

    dom.moviesList.innerHTML = '';

    if(sortMode === 'night-grouped'){
      const byNight = new Map();
      const ungrouped = [];
      movies.forEach(movie => {
        if(movie.nightId && findNightById(movie.nightId)){
          if(!byNight.has(movie.nightId)) byNight.set(movie.nightId, []);
          byNight.get(movie.nightId).push(movie);
        } else {
          ungrouped.push(movie);
        }
      });

      const orderedNights = state.nights
        .filter(n => byNight.has(n.id))
        .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt - a.createdAt));

      orderedNights.forEach(night => {
        dom.moviesList.appendChild(renderNightGroup(night, byNight.get(night.id)));
      });

      if(ungrouped.length){
        dom.moviesList.appendChild(renderUngroupedGroup(ungrouped));
      }
    } else {
      movies.forEach(movie => {
        dom.moviesList.appendChild(renderMovie(movie));
      });
    }

    dom.moviesList.classList.toggle('no-results', movies.length === 0);
  }

  function renderNightGroup(night, movies){
    const wrapper = document.createElement('section');
    wrapper.className = 'night-group';
    wrapper.dataset.nightId = night.id;

    const winner = getNightWinner(night);
    const ratedMovies = movies.filter(m => getAggregates(m).raterCount > 0);

    const header = document.createElement('header');
    header.className = 'night-header';

    const titleRow = document.createElement('div');
    titleRow.className = 'night-title-row';
    titleRow.innerHTML = `
      <h3 class="night-title">${sanitize(night.name)}</h3>
      <span class="night-date">${formatDateKeyShort(night.date) || '—'}</span>
    `;
    header.appendChild(titleRow);

    const winnerBadge = document.createElement('div');
    winnerBadge.className = 'night-winner-badge';
    if(winner){
      const agg = getAggregates(winner);
      const finalDisp = agg.avgFinalScore;
      const labelText = night.winnerOverride ? 'Winner (you crowned)' : 'Winner — biggest |Final|';
      winnerBadge.innerHTML = `
        <span class="night-winner-icon" aria-hidden="true">👑</span>
        <span class="night-winner-text">
          <span class="night-winner-label">${labelText}</span>
          <strong class="night-winner-name">${sanitize(winner.title)}</strong>
          <span class="night-winner-final">Final ${finalDisp.toFixed(1)}</span>
        </span>
      `;
    } else {
      winnerBadge.innerHTML = `
        <span class="night-winner-icon" aria-hidden="true">⏳</span>
        <span class="night-winner-text">
          <span class="night-winner-label">Winner pending</span>
          <span class="night-winner-final">${ratedMovies.length}/${movies.length} rated</span>
        </span>
      `;
    }
    header.appendChild(winnerBadge);

    const editor = document.createElement('details');
    editor.className = 'night-editor';
    editor.innerHTML = `
      <summary class="night-edit-toggle">Edit night</summary>
      <div class="night-edit-body">
        <div class="night-edit-field">
          <label>Name</label>
          <input type="text" class="night-name-input" value="${sanitize(night.name)}" maxlength="80" />
        </div>
        <div class="night-edit-field">
          <label>Date</label>
          <input type="date" class="night-date-input" value="${sanitize(night.date)}" />
        </div>
        <div class="night-edit-field">
          <label>Theme</label>
          <input type="text" class="night-theme-input" value="${sanitize(night.theme || '')}" maxlength="80" placeholder="Optional night theme" />
        </div>
        <div class="night-edit-field">
          <label>Crown winner</label>
          <select class="night-winner-select">
            <option value="">Auto (largest |Final|)</option>
            ${movies.map(m => `<option value="${m.id}"${night.winnerOverride === m.id ? ' selected' : ''}>${sanitize(m.title)}</option>`).join('')}
          </select>
        </div>
        <div class="night-edit-actions">
          <button type="button" class="btn primary small night-save-btn">Save</button>
          <button type="button" class="btn ghost small night-delete-btn">Delete Night</button>
        </div>
      </div>
    `;
    header.appendChild(editor);

    editor.querySelector('.night-save-btn')?.addEventListener('click', () => {
      if(!requireSignedIn('Please sign in with Google before editing nights.')) return;
      const nameInput = editor.querySelector('.night-name-input');
      const dateInput = editor.querySelector('.night-date-input');
      const themeInput = editor.querySelector('.night-theme-input');
      const winnerSelect = editor.querySelector('.night-winner-select');
      renameNight(night.id, nameInput?.value || '');
      setNightDate(night.id, dateInput?.value || '');
      setNightTheme(night.id, themeInput?.value || '');
      setNightWinnerOverride(night.id, winnerSelect?.value || null);
      persistNights();
      applyFilters();
    });
    editor.querySelector('.night-delete-btn')?.addEventListener('click', () => {
      if(!requireSignedIn('Please sign in with Google before deleting nights.')) return;
      if(!confirm(`Delete "${night.name}"? Movies in it will become ungrouped.`)) return;
      deleteNight(night.id);
      persist();
      persistNights();
      deleteNightFromRemote(night.id);
      applyFilters();
    });

    wrapper.appendChild(header);

    const cards = document.createElement('div');
    cards.className = 'night-cards';
    movies.forEach(movie => {
      const card = renderMovie(movie);
      if(winner && movie.id === winner.id){
        card.classList.add('movie-card--night-winner');
      }
      cards.appendChild(card);
    });
    wrapper.appendChild(cards);

    return wrapper;
  }

  function renderUngroupedGroup(movies){
    const wrapper = document.createElement('section');
    wrapper.className = 'night-group night-group--ungrouped';

    const header = document.createElement('header');
    header.className = 'night-header night-header--ungrouped';
    header.innerHTML = `
      <div class="night-title-row">
        <h3 class="night-title">Ungrouped</h3>
        <span class="night-date">No night assigned</span>
      </div>
    `;
    wrapper.appendChild(header);

    const cards = document.createElement('div');
    cards.className = 'night-cards';
    movies.forEach(movie => {
      cards.appendChild(renderMovie(movie));
    });
    wrapper.appendChild(cards);

    return wrapper;
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
    // Refresh night header so the winner badge reflects the new rating.
    if(movie.nightId && (dom.sort?.value || 'night-grouped') === 'night-grouped'){
      applyFilters();
    }
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
  const appPanels = document.querySelectorAll('.app-panel');

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
    appPanels?.forEach(panel => {
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
  renderAll();
  updateAuthPanel();
  await initFirebase();

  if(!remote.enabled){
    updateSyncStatus('error', 'Disconnected');
    debugLocalReason();
  }
})();