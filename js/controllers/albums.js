'use strict';
angular.module('skynetclient.albumsModule',[])
.controller('albumsCtrl',function($rootScope, $scope, $location, musicQueue, collection) {
  function setTiles(data) {
    if (data.length > 0) {
      $scope.tiles = data;
      $scope.loading = false;
      $rootScope.$emit('musicExist');
    }
  }
  $scope.reCheckMusic = function() {
    $scope.loading = true;
    getAlbums().then(function(data) {
      setTiles(data);
    },function(err) {
      $scope.loading = false;
    });
  };
  $scope.showAlbumDetails = function(album, event) {
    album.showButton=false;
    $location.path("albums/"+album.id+"/song/-0");
  };
  $scope.addAlbumToQ = function(albumId, event){
    event.stopPropagation();
    getTracksNamesByAlbumId(albumId).then(function(docs) {
      musicQueue.appendQueue(docs);
    },function(err){});
  };
  $scope.playAlbumTracks = function(albumId, event){
    event.stopPropagation();
    getTracksNamesByAlbumId(albumId).then(function(docs) {
      musicQueue.prependQueue(docs);
    },function(err){});
  };
  setTiles(collection);
})
.controller('albumsDetailsCtrl',function($scope, $routeParams, musicQueue, buttonFactory, coverData, trackData) {
  $scope.coverData = coverData;
  $scope.trackData = trackData;
  $scope.coverData.actions = buttonFactory.getMusicButtons();
  $scope.trackActions = buttonFactory.getMusicButtons();

  $scope.searchedSong = $routeParams['songName'];
  if ($scope.searchedSong !== '-0') {
    $scope.trackData.sort(function (a, b) {
      return a.title === $routeParams['songName'] ? 0 : 1;
    });
  }
  $scope.coverData['info'] = [
    { title:'Genre',val:$scope.coverData.genre.toString()},
    { title:'Artist',val:$scope.coverData.artist.toString()},
    { title:'Year', val:$scope.coverData.year}
  ];
});
