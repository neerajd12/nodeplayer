'use strict';
angular.module('skynetclient.playlistsModule',[])
.controller('playlistsCtrl',function ($scope, $rootScope, $location, musicQueue, Notification, playlists) {
  $scope.playLists = playlists;
  $scope.arts = {};
  function createArt() {
    $scope.loading = true;
    $scope.playLists.forEach(function(element, index, array) {
      getPlaylistArt(element).then(function(data) {
        $scope.arts[element] = data;
      },function(err){
        console.log(err);
      });;
    });
    $scope.loading = false;
  }
  $scope.showButtonsId = function (id) {
    $scope.mouseOn = id;
  };
  $scope.goToPlaylist = function(playlistsId) {
    $location.path("playlists/"+playlistsId);
  };
  $scope.addPlaylistToQ = function(playlistId, event) {
    event.stopPropagation();
    getPlaylistTrackNames(playlistId).then(function(docs) {
      musicQueue.appendQueue(docs);
    },function(err){});
  };
  $scope.playPlaylist = function(playlistId, event) {
    event.stopPropagation();
    getPlaylistTrackNames(playlistId).then(function(docs) {
      musicQueue.prependQueue(docs);
    },function(err){});
  };
  $scope.reCheckPlaylists = function() {
    $scope.loading = true;
    getPlayLists().then(function(data) {
      $scope.playLists = data;
      createArt();
    },function(err){
      console.log(err);
    });
  };
  createArt();
})
.controller('playlistDetailsCtrl',function ($scope, $route, $location, musicQueue, buttonFactory, coverData, trackData) {
  $scope.coverData = coverData;
  $scope.trackData = trackData;
  $scope.coverData['title'] = $route.current.params.playlistId;
  $scope.coverData['info'] = [];
  $scope.coverData.actions = buttonFactory.getMusicButtons();
  $scope.trackActions = buttonFactory.getMusicButtons();

  var deleteFromPlaylist = function (tracks, trackId) {
    if (trackId) {
      let index = $scope.trackData.findIndex(function(data){return data.id == trackId});
      removeTracksFromPlaylist([tracks], $route.current.params.playlistId);
      $scope.trackData.splice(index, 1);
    } else {
      removeTracksFromPlaylist(tracks, $route.current.params.playlistId);
      $scope.trackData = [];
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
