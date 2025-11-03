let allSongs = [];
let allLyrics = [];
let activeSongs = [];
let currentIndex = -1;

async function loadSongs() {
  try {
    allSongs = await fetch('stream_dev.json').then(res => res.json());
    allLyrics = await fetch('lyricsStream_dev.json').then(res => res.json());
    renderSongs(allSongs);
  } catch (err) {
    console.error("Error loading songs:", err);
  }
}

function renderSongs(songs) {
  activeSongs = songs;
  const songList = document.getElementById('song-list');
  songList.innerHTML = "";

  songs.forEach((song, index) => {
    const item = document.createElement('div');
    item.className = "song-item";
    item.innerHTML = `
      <img src="${song.albumArt}" alt="cover">
      <div>
        <strong>${song.title}</strong><br>
        <small>${song.artist}</small>
      </div>
    `;
    item.onclick = () => playSong(index);
    songList.appendChild(item);
  });
}

function playSong(index) {
  currentIndex = index;
  const song = activeSongs[index];

  // Transform Google Drive link into preview link
  let previewUrl = song.url;
  try {
    if (previewUrl.includes('/view')) {
      previewUrl = previewUrl.replace('/view', '/preview');
    } else if (previewUrl.includes('uc?id=')) {
      const fileId = new URL(previewUrl).searchParams.get('id');
      previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (previewUrl.includes('uc?export=download&id=')) {
      const fileId = new URL(previewUrl).searchParams.get('id');
      previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    }
  } catch (err) {
    console.error("Invalid song URL:", previewUrl, err);
  }

  // Match song.songID with lyric.id
  const lyricEntry = allLyrics.find(l => l.id === song.songID);

  let lyricsText = "Lyrics not available";
  if (lyricEntry) {
    const verses = lyricEntry.verses ? lyricEntry.verses.join("\n\n") : "";
    const chorus = lyricEntry.chorus ? `\n\nChorus:\n${lyricEntry.chorus}` : "";
    lyricsText = verses + chorus;
  }

  // Update lyrics content
  const lyricsContent = document.getElementById('lyrics-content');
  lyricsContent.innerHTML = `
    <div class="lyrics-box">
      <h2>${song.title}</h2>
      <h4>${song.artist}</h4>
      <pre>${lyricsText}</pre>
    </div>
  `;
  lyricsContent.classList.remove('hidden');

  // Update Now Playing bar
  document.getElementById('np-art').src = song.albumArt;
  document.getElementById('np-title').textContent = song.title;
  document.getElementById('np-artist').textContent = song.artist;
  document.getElementById('np-iframe').src = previewUrl;
  document.getElementById('now-playing').style.display = 'flex';
}

function nextSong() {
  if (currentIndex < activeSongs.length - 1) {
    playSong(currentIndex + 1);
  }
}

function prevSong() {
  if (currentIndex > 0) {
    playSong(currentIndex - 1);
  }
}

document.getElementById('search').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allSongs.filter(song => song.title.toLowerCase().includes(query));
  renderSongs(filtered.length ? filtered : allSongs);
});

// Sidebar toggle with overlay
const menuBtn = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
});

// Toggle lyrics visibility with animation
document.getElementById('toggle-lyrics').addEventListener('click', () => {
  const content = document.getElementById('lyrics-content');
  const btn = document.getElementById('toggle-lyrics');
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    btn.textContent = 'Hide Lyrics';
  } else {
    content.classList.add('hidden');
    btn.textContent = 'Show Lyrics';
  }
});

// Light/Dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle('light');
  const btn = document.querySelector('.toggle');
  btn.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
}

loadSongs();
