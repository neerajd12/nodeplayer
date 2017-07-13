'use strict';
angular.module('skynetclient.settingsModule',[])
.controller('settingsCtrl',function ($scope, $rootScope, $route) {
  $scope.musicHome = getMusicHome();
  $scope.selectDirectory = function() {
    $scope.musicHome = selectMusicHome();
  }

  $scope.clearCache = function() {
    cleanMusicCache();
  }

});
