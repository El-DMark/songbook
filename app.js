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

  // --- Transform Google Drive link into preview link ---
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

  // 🎵 Show only lyrics in the main area
    const lyricEntry = allLyrics.find(l => l.songID === song.id);
    
  lyricsDisplay.innerHTML = `
    <div class="lyrics-box">
      <h2>${song.title}</h2>
      <h4>${song.artist}</h4>
      <pre>${lyricEntry ? lyricEntry.lyrics : "Lyrics not available"}</pre>
    </div>
  `;

  // 🎵 Update Now Playing bar with art + info
  document.getElementById('np-art').src = song.albumArt;
  document.getElementById('np-title').textContent = song.title;
  document.getElementById('np-artist').textContent = song.artist;

  // 🎵 Update the Now Playing iframe (the only player)
  const iframe = document.getElementById('np-iframe');
  iframe.src = previewUrl;

  // Show the Now Playing bar
  document.getElementById('now-playing').style.display = 'flex';
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
