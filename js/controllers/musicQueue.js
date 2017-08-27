'use strict';
angular.module('skynetclient.musicQueueModule',[])
.controller('musicQueueCtrl', function ($scope, $rootScope, $route, musicQueue, buttonFactory, coverData, trackData, favData) {
  $scope.coverData = coverData;
  $scope.trackData = trackData;
  $scope.favData = favData;
  $scope.coverData.actions = buttonFactory.getMusicButtons();
  $scope.trackActions = buttonFactory.getMusicButtons();

  var clearQ = function (trackData, trackId) {
    if (trackId) {
      musicQueue.removeTrack(trackData.fileName);
      let index = $scope.trackData.findIndex(function(data){return data._id == trackId});
      $scope.trackData.splice(index, 1);
    } else {
      musicQueue.removeTracks(trackData.map(function(val){return val.fileName}));
      $scope.trackData = [];
    }
    if ($scope.trackData.length < 1) {
      $route.reload();
    }
  };

  $scope.coverData.actions[0].visible = false;
  $scope.coverData.actions[1].label = 'Clear Queue';
  $scope.coverData.actions[1].icon = 'clear_all';
  $scope.coverData.actions[1].color = 'md-warn';
  $scope.coverData.actions[1].action = clearQ;

  $scope.trackActions[1].label = 'Clear Queue';
  $scope.trackActions[1].icon = 'clear_all';
  $scope.trackActions[1].color = 'md-warn';
  $scope.trackActions[1].action = clearQ;

  function queueSettings() {
    let track = $scope.trackData[musicQueue.getCurrentTrackNum()];
    if (track) {
      $scope.coverData['title'] = track.title;
      $scope.coverData['info'] = [
        { title:'Album', val:track.album},
        { title:'Artist',val:track.artist.toString()}
      ];
    }
  }

  /*$rootScope.$on('currentTrackChanged', function () {
    getTracksByFileNames(musicQueue.getTracks()).then(function(data) {
      $scope.trackData = data;
      queueSettings();
    },function(err) {
      console.log(err);
    });
  });*/
  queueSettings();

});
