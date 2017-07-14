'use strict';
angular.module('skynetclient.settingsModule',[])
.controller('settingsCtrl',function ($scope, themeService) {
  $scope.themes = themeService.themes;
  $scope.currentTheme = $scope.theme.theme;
  $scope.musicHome = getMusicHome();

  $scope.selectDirectory = function() {
    $scope.musicHome = selectMusicHome();
  }

  $scope.clearCache = function() {
    cleanMusicCache();
  }
});
