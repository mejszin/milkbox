const { ipcRenderer } = require('electron');

function cancelSubmit() {
  ipcRenderer.send('cancel-submit-album', {});
}

function submitAlbum() {
    var artist = document.getElementById('artist-input');
    var album = document.getElementById('album-input');
    var year = document.getElementById('year-input');
    var genres = document.getElementById('genres-input');
    ipcRenderer.send('submit-album', {
        artist: artist.value,
        album: album.value,
        year: year.value,
        genres: genres.value
    });
  }