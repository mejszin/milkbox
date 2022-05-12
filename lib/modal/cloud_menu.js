const { ipcRenderer } = require('electron');
      
function submitAlbum() {
    hideModal();
    ipcRenderer.send('show-submit-album', {});
}

function setAlias() {
    hideModal();
    ipcRenderer.send('show-set-alias', {});
}

function openForum() {
    hideModal();
    ipcRenderer.send('open-forum', {});
}

function hideModal() {
    ipcRenderer.send('hide-cloud-menu', {});
}