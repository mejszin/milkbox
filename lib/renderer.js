function displayCloudModal() {
    ipcRenderer.send('show-cloud-menu');
}

displayTracksPage();
setStatisticsAPI();