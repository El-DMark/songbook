let allSongs = [];
let allLyrics = [];
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
  const songList = document.getElementById('song-list');
  const lyricsDisplay = document.getElementById('lyrics-display');
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
  const song = allSongs[index];
  const lyricsDisplay = document.getElementById('lyrics-display');

  // Main lyrics + embedded Google Drive player
  lyricsDisplay.innerHTML = `
    <div class="player-box">
      <img src="${song.albumArt}" alt="Album Art">
      <div class="info">
        <strong>${song.title}</strong><br>
        <small>${song.artist}</small>
      </div>
    </div>
    <iframe
      src="${song.url.replace('/view', '/preview')}"
      allow="autoplay"
      style="width:100%; height:80px; border:none; margin-top:1rem;"
    ></iframe>
  `;

  // Update Now Playing bar (visual only — no audio control)
  document.getElementById('np-art').src = song.albumArt;
  document.getElementById('np-title').textContent = song.title;
  document.getElementById('np-artist').textContent = song.artist;

  // Remove audio logic — Google Drive handles playback
  const audio = document.getElementById('np-audio');
  audio.src = "";
  audio.style.display = "none"; // optional: hide unused audio tag

  document.getElementById('now-playing').style.display = 'flex';
  // Auto-advance
  audio.onended = () => {
    if (currentIndex < allSongs.length - 1) {
      playSong(currentIndex + 1);
    }
  };
}
function nextSong() {
  if (currentIndex < allSongs.length - 1) {
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
  renderSongs(filtered);
});
function toggleDarkMode() {
  document.body.classList.toggle('dark');
}

loadSongs();
