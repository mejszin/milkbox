const { ipcRenderer } = require('electron');
var glob = require('glob');
var ini = require('ini');
var path = require('path');
var fs = require('fs');

const music_metadata = require('music-metadata');

const config = ini.parse(fs.readFileSync('./data/config.ini', 'utf-8'));

var all_track_paths = [];
var now_playing_tracks = [];
var now_playing_index = 0;
var now_playing_playlist_name = '';