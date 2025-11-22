let allSongs = [];
let allLyrics = [];
let activeSongs = [];
let currentIndex = -1;
let tilesView = true;

// Boot
document.addEventListener('DOMContentLoaded', () => {
  wireControls();
  loadData();
});

function wireControls() {
  const themeToggle = document.getElementById('theme-toggle');
  const viewToggle = document.getElementById('view-toggle');
  const menuBtn = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const search = document.getElementById('search');
  const toggleLyricsBtn = document.getElementById('toggle-lyrics');

  // Theme
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    themeToggle.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
  });

  // View toggle (tiles <-> list)
  viewToggle.addEventListener('click', () => {
    tilesView = !tilesView;
    renderView(activeSongs);
    viewToggle.textContent = tilesView ? '🔲' : '📃';
  });

  // Sidebar (mobile)
  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });

  // Search
  search.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = allSongs.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q)
    );
    renderView(filtered.length ? filtered : allSongs);
  });

  // Lyrics hide/show
  toggleLyricsBtn.addEventListener('click', () => {
    const content = document.getElementById('lyrics-content');
    const btn = document.getElementById('toggle-lyrics');
    const isHidden = content.classList.toggle('hidden');
    btn.textContent = isHidden ? 'Show lyrics' : 'Hide lyrics';
  });

  // Now playing controls
  document.getElementById('prev-btn').addEventListener('click', prevSong);
  document.getElementById('next-btn').addEventListener('click', nextSong);
}

async function loadData() {
  try {
    // Uses your existing JSON endpoints
    const [songsRes, lyricsRes] = await Promise.all([
      fetch('stream_dev.json'),
      fetch('lyricsStream_dev.json')
    ]);
    allSongs = await songsRes.json();
    allLyrics = await lyricsRes.json();
    activeSongs = allSongs;

    renderView(allSongs);
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

/* ---------- Rendering ---------- */

function renderView(songs) {
  activeSongs = songs;
  renderTiles(songs);
  renderList(songs);
}

function renderTiles(songs) {
  const grid = document.getElementById('tiles');
  if (!grid) return;

  grid.innerHTML = '';
  grid.style.display = tilesView ? 'grid' : 'none';

  songs.forEach((song, i) => {
    const card = document.createElement('article');
    card.className = 'tile';
    card.innerHTML = `
      <img class="tile-cover" src="${sanitize(song.albumArt)}" alt="${escapeHtml(song.title)} cover" />
      <div class="tile-body">
        <div class="tile-title">${escapeHtml(song.title)}</div>
        <div class="tile-artist">${escapeHtml(song.artist)}</div>
      </div>
    `;
    card.addEventListener('click', () => playSong(i));
    grid.appendChild(card);
  });
}

function renderList(songs) {
  const list = document.getElementById('song-list');
  if (!list) return;

  list.innerHTML = '';
  // Show sidebar on desktop, mobile toggle via button
  songs.forEach((song, i) => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.innerHTML = `
      <img src="${sanitize(song.albumArt)}" alt="${escapeHtml(song.title)} cover">
      <div class="meta">
        <strong>${escapeHtml(song.title)}</strong>
        <small>${escapeHtml(song.artist)}</small>
      </div>
      <button class="icon-btn" aria-label="Play">▶</button>
    `;
    item.addEventListener('click', () => playSong(i));
    if (i === currentIndex) item.classList.add('active');
    list.appendChild(item);
  });
}

/* ---------- Playback + Lyrics ---------- */

function playSong(index) {
  currentIndex = index;
  const song = activeSongs[index];
  if (!song) return;

  // Preview URL transform for Google Drive
  const previewUrl = toDrivePreview(song.url);

  // Lyrics
  const lyricEntry = allLyrics.find(l => l.id === song.songID);
  const lyrTitle = document.getElementById('lyr-title');
  const lyrArtist = document.getElementById('lyr-artist');
  const lyrArt = document.getElementById('lyr-art');
  const lyrContent = document.getElementById('lyrics-content');

  lyrTitle.textContent = song.title;
  lyrArtist.textContent = song.artist;
  lyrArt.src = sanitize(song.albumArt);

  let lyricsText = 'Lyrics not available';
  if (lyricEntry) {
    const verses = Array.isArray(lyricEntry.verses) ? lyricEntry.verses.join('\n\n') : '';
    const chorus = lyricEntry.chorus ? `\n\nChorus:\n${lyricEntry.chorus}` : '';
    lyricsText = `${verses}${chorus}`.trim();
  }
  lyrContent.innerHTML = `<pre>${escapeHtml(lyricsText)}</pre>`;
  lyrContent.classList.remove('hidden');

  // Now Playing bar
  document.getElementById('np-art').src = sanitize(song.albumArt);
  document.getElementById('np-title').textContent = song.title;
  document.getElementById('np-artist').textContent = song.artist;

  const iframe = document.getElementById('np-iframe');
  iframe.src = previewUrl;

  const np = document.getElementById('now-playing');
  np.classList.remove('hidden');

  // Refresh selection state in list
  renderList(activeSongs);
}

function nextSong() {
  if (currentIndex < activeSongs.length - 1) playSong(currentIndex + 1);
}

function prevSong() {
  if (currentIndex > 0) playSong(currentIndex - 1);
}

/* ---------- Helpers ---------- */

function toDrivePreview(url) {
  try {
    if (!url) return '';
    if (url.includes('/view')) return url.replace('/view', '/preview');
    if (url.includes('uc?id=')) {
      const u = new URL(url);
      const id = u.searchParams.get('id');
      return `https://drive.google.com/file/d/${id}/preview`;
    }
    if (url.includes('uc?export=download&id=')) {
      const u = new URL(url);
      const id = u.searchParams.get('id');
      return `https://drive.google.com/file/d/${id}/preview`;
    }
    return url;
  } catch {
    return url;
  }
}

function sanitize(src) {
  // basic guard for empty or invalid src
  return src || '';
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=\/]/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;', '/': '&#x2F;',
    '`': '&#x60;', '=': '&#x3D;'
  }[s]));
}
