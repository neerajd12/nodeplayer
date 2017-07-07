const fServ = require('electron').remote.require('./js/node_services/fileService');
const {dialog} = require('electron').remote;
const ipcR = require('electron').ipcRenderer;
ipcR.on('musicUpdate', (event, message) => {
  angular.element(document.querySelector('[ng-controller="AppCtrl"]')).scope().postMsg(message);
});
/******************* Config ****************** */
getMusicHome = () => {
  return fServ.getDB().getMusicHome();
};

selectMusicHome = () => {
  let selected = dialog.showOpenDialog({properties: ['openDirectory']});
  if (selected) {
    fServ.updateMusicHome(selected[0]);
  }
};

getMusicDir = () => {
  return fServ.getMusicDir();
};

getTheme = () => {
  return fServ.getDB().getTheme();
};

updateTheme = (oldTheme, newTheme) => {
  return fServ.getDB().updateTheme(oldTheme, newTheme);
};

getQueue = () => {
  return fServ.getDB().getQueue();
};
getQueueTracks = () => {
  return fServ.getDB().getQueueTracks();
};
addToQueue = (tracks) => {
  return fServ.getDB().addToQueue(tracks);
};
removeFromQueue = (tracks) => {
  return fServ.getDB().removeFromQueue(tracks);
};

clearQueue = () => {
  return fServ.getDB().clearQueue();
};

/******************* Albums ****************** */
getAlbums = () => {
  return fServ.getDB().getAlbums();
};
getAlbumById = (albumId) => {
  return fServ.getDB().getAlbumById(albumId);
};
getAlbumByTrackId = (trackId) => {
  return fServ.getDB().getAlbumByTrackId(trackId);
};
getAlbumByTrackName = (trackName) => {
  return fServ.getDB().getAlbumByTrackName(trackName);
};
/******************* Track ****************** */
getTracks = (trackId) => {
  return fServ.getDB().getTracks();
};

getTrackById = (trackId) => {
  return fServ.getDB().getTrackById(trackId);
};
getTrackByFileName = (fileName) => {
  return fServ.getDB().getTrackByFileName(fileName);
};
getTracksByFileNames = (fileNames) => {
  return fServ.getDB().getTracksByFileNames(fileNames);
};
getTracksByIds = (trackIds) => {
  return fServ.getDB().getTracksByIds(trackIds);
};
getTracksByAlbumId = (albumId) => {
  return fServ.getDB().getTracksByAlbumId(albumId);
};
getTracksNamesByAlbumId = (albumId) => {
  return fServ.getDB().getTracksNamesByAlbumId(albumId);
};
searchTracks = (searchText) => {
  return fServ.getDB().searchTracks(searchText);
};
/******************* Favs ****************** */
getFavs = () => {
  return fServ.getDB().getFavTracks();
};
updateTracksFavIcon = (tracks, icon) => {
  fServ.getDB().updateTracksFavIcon(tracks.map(function(val){return val.fileName}),icon);
};
updateAlbumFavIcon = (albumId, icon) => {
  fServ.getDB().updateAlbumFavIcon(albumId, icon);
};
/******************* Playlists ****************** */
getPlayLists = () => {
  return fServ.getDB().getPlaylists();
};
getPlaylistTracks = (id) => {
  return fServ.getDB().getPlaylistTracks(id);
};
getPlaylistTrackNames = (id) => {
  return fServ.getDB().getPlaylistTrackNames(id);
};
getPlaylistArt = (playlistId) => {
  return fServ.getDB().getPlaylistArt(playlistId);
};
addTracksToPlayList = (tracks, playlistId) => {
  fServ.getDB().addTracksToPlayList(tracks.map(function(val){return val.fileName}), playlistId);
};
removeTracksFromPlaylist = (tracks, playlistId) => {
  fServ.getDB().removeTracksFromPlaylist(tracks.map(function(val){return val.fileName}), playlistId);
};
addAlbumToPlayList = (albumId, playlistId) => {
  fServ.getDB().addAlbumToPlayList(albumId, playlistId);
};
removeAlbumFromPlaylist = (albumId, playlistId) => {
  fServ.getDB().removeAlbumFromPlaylist(albumId, playlistId);
};
deletePlayList = (playlistId) => {
  fServ.getDB().deletePlayList(playlistId);
};
