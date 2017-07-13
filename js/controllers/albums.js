'use strict';
angular.module('skynetclient.albumsModule',[])
.controller('albumsCtrl',function($rootScope, $scope, $location, musicQueue, Notification, collection) {
  $scope.tiles=[];

  $scope.$on('PROCESSING', function(event) {
    $scope.cacheingData = true;
  });

  angular.forEach(['INIT', 'UPDATE', 'ADD'], function(eventType) {
    $scope.$on(eventType, function(event) {
      $scope.reCheckMusic();
    });
  });

  angular.forEach(['REMOVE', 'EMPTY'], function(eventType) {
    $scope.$on(eventType, function(event) {
      getAlbums().then(function(data) {
        $scope.$evalAsync(function() {
          $scope.tiles = data;
        });
      },function(err) {});
    });
  });

  function setTiles(data) {
    $scope.$evalAsync(function() {
      $scope.cacheingData = false;
      if (data.length > 0) {
        if ($scope.tiles.length == 0) {
          $scope.tiles = data;
        } else {
          let currentTilesIds = $scope.tiles.map(function(a){return a._id});
          data.forEach(function(al, index, data){
            if (currentTilesIds.indexOf(al._id) == -1) {
              $scope.tiles.push(al);
            }
          });
        }
        $scope.loading = false;
      }
    });
  };
  $scope.reCheckMusic = function() {
    getAlbums().then(function(data) {
      setTiles(data);
    },function(err) {});
  };
  $scope.showAlbumDetails = function(album, event) {
    album.showButton=false;
    $location.path("albums/"+album._id+"/song/-0");
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
.controller('albumsDetailsCtrl',function($scope, $routeParams, musicQueue, buttonFactory, coverData, trackData, favData) {
  $scope.coverData = coverData;
  $scope.trackData = trackData;
  $scope.favData = favData;
  $scope.coverData.actions = buttonFactory.getMusicButtons();
  $scope.trackActions = buttonFactory.getMusicButtons();

  $scope.searchedSong = $routeParams['songName'];
  if ($scope.searchedSong !== '-0') {
    $scope.trackData.sort(function (a, b) {
      return a.title === $routeParams['songName'] ? 0 : 1;
    });
  }
  $scope.isArray = angular.isArray;
  $scope.coverData['info'] = [
    { title:'Genre',val:$scope.coverData.genre},
    { title:'Year', val:$scope.coverData.year},
    { title:'Artist',val:$scope.coverData.artist}
  ];
});
