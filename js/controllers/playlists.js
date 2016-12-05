'use strict';
angular.module('skynetclient.playlistsModule',[])
.controller('playlistsCtrl',function ($scope, $rootScope, $location, musicQueue, musicService, Notification, playlists) {
  $scope.playLists = playlists;
  $scope.arts = {};
  function createArt() {
    $scope.loading = true;
    $scope.playLists.forEach(function(element, index, array) {
      $scope.arts[element] = musicService.getPlaylistArt(element);
    });
    $scope.loading = false;
  }
  $scope.showButtonsId = function (id) {
    $scope.mouseOn = id;
  };
  $scope.goToPlaylist = function(playlistsId) {
    $location.path("playlist/"+playlistsId);
  };
  $scope.addPlaylistToQ = function(playlistId, event){
    event.stopPropagation();
    musicQueue.appendQueue(musicService.getPlaylistTrackNames(playlistId));
  };
  $scope.playPlaylist = function(playlistId, event){
    event.stopPropagation();
    musicQueue.prependQueue(musicService.getPlaylistTrackNames(playlistId));
  };
  $scope.reCheckPlaylists = function(){
    $scope.loading = true;
    $scope.playLists = musicService.getPlayLists();
    createArt();
  };
  createArt();
})
.controller('playlistDetailsCtrl',function ($scope, $route, $location, musicQueue, musicService, buttonFactory, coverData, trackData) {
  $scope.coverData = coverData;
  $scope.trackData = trackData;
  $scope.coverData['title'] = $route.current.params.playlistId;
  $scope.coverData['info'] = [];
  $scope.coverData.actions = buttonFactory.getMusicButtons();
  $scope.trackActions = buttonFactory.getMusicButtons();

  var deleteFromPlaylist = function (tracks, trackId) {
    if (trackId) {
      let index = $scope.trackData.findIndex(function(data){return data.id == trackId});
      musicService.removeTrackFromPlaylist(tracks, $route.current.params.playlistId, true);
      $scope.trackData.splice(index, 1);
    } else {
      musicService.removeTracksFromPlaylist(tracks, $route.current.params.playlistId);
    }
    if ($scope.trackData.length < 1) {
      $location.path('playlists');
    }
  };

  $scope.coverData.actions[2].label = 'Delete Playlist';
  $scope.coverData.actions[2].icon = 'delete';
  $scope.coverData.actions[2].color = 'md-warn';
  $scope.coverData.actions[2].action = deleteFromPlaylist;

  $scope.trackActions[2].label = 'Delete from Playlist';
  $scope.trackActions[2].icon = 'delete';
  $scope.trackActions[2].color = 'md-warn';
  $scope.trackActions[2].action = deleteFromPlaylist;

});
