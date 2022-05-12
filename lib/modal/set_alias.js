const { ipcRenderer } = require('electron');

function cancelSet() {
  ipcRenderer.send('hide-set-alias', {});
}

function setAlias() {
    var alias = document.getElementById('alias-input');
    ipcRenderer.send('set-alias', {
        alias: alias.value
    });
  }