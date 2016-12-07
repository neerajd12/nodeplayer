const fServ = require('electron').remote.require('./js/node_services/fileService');
const {dialog} = require('electron').remote;
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
function getAlbumArt(albumId) {
  return fServ.getDB().getAlbumArt();
};
function updateAlbums(albums) {

};
function updateAlbum(album) {

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
function updateTracks(tracks) {

};
function updateTrack(track) {

};
function searchTracks(searchText) {
  fServ.getDB().searchTracks();
};
/******************* Favs ****************** */
function getFavs() {
  return fServ.getDB().getFavTracks(albumId);
};

function setFavSingleTrack(track, icon) {

};
function setFavMultipleTracks(tracks, icon) {

};
function setFavAlbum(albumId, icon) {

};
/******************* Playlists ****************** */
function getPlayLists() {
  return fServ.getDB().getPlaylists();
};
function getPlaylistTracks(id) {
  return fServ.getDB().getPlaylistTracks(id);
};
function getPlaylistTrackNames(id) {

};
function getPlaylistArt(playlistId) {
  return fServ.getDB().getPlaylistArt(playlistId);
};

function addTrackToPlayList(track, playlistId) {

};
function addTracksToPlayList(tracks, playlistId) {

};
function removeTrackFromPlaylist(track, playlistId) {

};
function removeTracksFromPlaylist(tracks, playlistId) {

};
function addAlbumToPlayList(albumId, playlistId) {

};
function removeAlbumFromPlaylist(albumId, playlistId) {

};
function deletePlayList(playlistId) {

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
