const fServ = require('electron').remote.require('./js/node_services/fileService');
const {dialog} = require('electron').remote;
const ipcR = require('electron').ipcRenderer;
ipcR.on('musicUpdate', (event, message) => {
  if (message === 'init') {
    angular.element(document.querySelector('[ng-controller="AppCtrl"]')).scope().initDone=0;
  } else if (message === 'update') {
    angular.element(document.querySelector('[ng-controller="AppCtrl"]')).scope().initDone=1;
  }
});
/******************* Albums ****************** */
function getAlbums() {
  return fServ.getDB().getAlbums();
};
function getAlbumById(albumId) {
  return fServ.getDB().getAlbumById(albumId);
};
function getAlbumByTrackId(trackId) {
  return fServ.getDB().getAlbumByTrackId(trackId);
};
function getAlbumByTrackName(trackName) {
  return fServ.getDB().getAlbumByTrackName(trackName);
};
/******************* Track ****************** */
function getTrackById(trackId) {
  return fServ.getDB().getTrackById(trackId);
};
function getTrackByFileName(fileName) {
  return fServ.getDB().getTrackByFileName(fileName);
};
function getTracksByFileNames(fileNames) {
  return fServ.getDB().getTracksByFileNames(fileNames);
};
function getTracksByIds(trackIds) {
  return fServ.getDB().getTracksByIds(trackIds);
};
function getTracksByAlbumId(albumId) {
  return fServ.getDB().getTracksByAlbumId(albumId);
};
function getTracksNamesByAlbumId(albumId) {
  return fServ.getDB().getTracksNamesByAlbumId(albumId);
};
function searchTracks(searchText) {
  return fServ.getDB().searchTracks(searchText);
};
/******************* Favs ****************** */
function getFavs() {
  return fServ.getDB().getFavTracks(albumId);
};
function updateTracksFavIcon(tracks, icon) {
  fServ.getDB().updateTracksFavIcon(tracks.map(function(val){return val.id}),icon);
};
function updateAlbumFavIcon(albumId, icon) {
  fServ.getDB().updateAlbumFavIcon(albumId, icon);
};
/******************* Playlists ****************** */
function getPlayLists() {
  return fServ.getDB().getPlaylists();
};
function getPlaylistTracks(id) {
  return fServ.getDB().getPlaylistTracks(id);
};
function getPlaylistTrackNames(id) {
  return fServ.getDB().getPlaylistTrackNames(id);
};
function getPlaylistArt(playlistId) {
  return fServ.getDB().getPlaylistArt(playlistId);
};
function addTracksToPlayList(tracks, playlistId) {
  fServ.getDB().addTracksToPlayList(tracks.map(function(val){return val.id}), playlistId);
};
function removeTracksFromPlaylist(tracks, playlistId) {
  fServ.getDB().removeTracksFromPlaylist(tracks.map(function(val){return val.id}), playlistId);
};
function addAlbumToPlayList(albumId, playlistId) {
  fServ.getDB().addAlbumToPlayList(albumId, playlistId);
};
function removeAlbumFromPlaylist(albumId, playlistId) {
  fServ.getDB().removeAlbumFromPlaylist(albumId, playlistId);
};
function deletePlayList(playlistId) {
  fServ.getDB().deletePlayList(playlistId);
};

function selectMusicHome() {
  let selected = dialog.showOpenDialog({properties: ['openDirectory']});
  if (selected) {
    fServ.updateMusicHome(selected[0]);
  }
};
function getMusicDir() {
  return fServ.getMusicDir();
};
