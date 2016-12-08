'use strict';
angular.module('skynetclient.detailsViewModule',[])
.controller('detailsViewCtrl',function($scope, $rootScope, musicQueue) {
  $scope.art = Array.from(new Set($scope.trackData.map(function(tt){return tt.picture})));

  $scope.toggleFav = function(tracks, trackId) {
    let toUpdate = 'favorite_border';
    if (trackId) {
      if (tracks.favIcon === 'favorite_border') {
        toUpdate = 'favorite';
      }
      updateTracksFavIcon([tracks], toUpdate);
    } else {
      if ($scope.coverData.favIcon === 'favorite_border') {
        toUpdate = 'favorite';
      }
      tracks.forEach(function(val){ val.favIcon = toUpdate});
      updateTracksFavIcon(tracks, toUpdate);
    }
    checkCoverFavIcon();
  };
  $scope.coverData.actions[3].action = $scope.toggleFav;
  $scope.trackActions[3].visible = false;

  $scope.tracks = {
    getItemAtIndex : function(index){
      if (index < $scope.trackData.length ) {
        return $scope.trackData[index];
      }
    },
    getLength : function() {
      return $scope.trackData.length;
    },
    getAllTracks : function() {
      return $scope.trackData;
    }
  };

  $scope.showGridBottomSheet = function(parentIndex) {
    let track = $scope.trackData[parentIndex];
    if ($scope.trackPlaying && $scope.trackPlaying.fileName === track.fileName) {
      $scope.trackActions[0].visible = false;
    }
    if (musicQueue.getTracks().indexOf(track.fileName) > -1) {
      $scope.trackActions[1].label = 'Clear Queue';
      $scope.trackActions[1].icon = 'remove_from_queue';
      $scope.trackActions[1].color = 'md-warn';
    } else {
      $scope.trackActions[1].label = 'Add to Queue';
      $scope.trackActions[1].icon = 'queue_music';
      $scope.trackActions[1].color = 'md-accent md-hue-3';
    }
    $scope.clickedTrackId = track.id;
  };

  $rootScope.$on('currentTrackChanged', function() {
    $scope.trackPlaying = musicQueue.getCurrent();
  });

  $scope.trackPlaying = musicQueue.getCurrent();

  function checkCoverFavIcon() {
    if ($scope.trackData.filter(function(track){ return track.favIcon === 'favorite'}).length === $scope.trackData.length) {
      $scope.coverData.actions[3].icon = $scope.coverData.favIcon = 'favorite';
      $scope.coverData.actions[3].label='Remove from Favorite';
    } else {
      $scope.coverData.actions[3].icon = $scope.coverData.favIcon = 'favorite_border';
      $scope.coverData.actions[3].label='Add to Favorite';
    }
  };
  checkCoverFavIcon();
});
