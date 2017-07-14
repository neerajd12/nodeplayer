'use strict';
angular.module('skynetclient.app',[])
.controller('AppCtrl', function ($scope, $rootScope, $route, $location, $mdColors, Notification, themeService) {

  $scope.initDone = -1;

  themeService.applyDefault($scope);
  $scope.applyTheme = function(item) {
    themeService.applyTheme(item, $scope, true);
  };
  $scope.postMsg = function(msg) {
    $scope.initDone = 0;
    $scope.$broadcast(msg);
  };
});
