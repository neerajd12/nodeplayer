'use strict';
angular.module('skynetclient.settingsModule',[])
.controller('settingsCtrl',function ($scope, $rootScope, $route) {
  $scope.musicHome = getMusicDir();
  $scope.selectDirectory = function() {
    selectMusicHome();
    $scope.musicHome = getMusicDir();
  }
});
