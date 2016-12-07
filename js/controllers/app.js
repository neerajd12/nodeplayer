'use strict';
angular.module('skynetclient.app',[])
.controller('AppCtrl', function ($scope, $rootScope, $route, $location, $mdColors) {
  $scope.initDone = false;
  $scope.themes = ['default', 'defaultLight', 'choclate', 'choclateLight', 'slate', 'slateLight'];
  $scope.theme = localStorage["theme"] || "default";
  $scope.btnFill = 'white';
  $scope.background1 = '700';
  $scope.background2 = '500';
  $rootScope.applyTheme = function(item) {
    if (angular.isDefined(item)) {
      localStorage["theme"] = $scope.theme = item;
    }
    if ($scope.theme.indexOf('Light') > -1) {
      $scope.background1 = 'A100';
      $scope.background2 = '50';
      $scope.btnFill = 'black';
    } else {
      $scope.background1 = '700';
      $scope.background2 = '500';
      $scope.btnFill = 'white';
    }
    let coloBackground1 = {'backgroundColor':  $scope.theme+'-primary-'+$scope.background1};
    $mdColors.applyThemeColors(angular.element( document.querySelector('#mainPlayer')), {'backgroundColor':  $scope.theme+'-primary-800'});
    $mdColors.applyThemeColors(angular.element( document.querySelector('#content')), {'backgroundColor':  $scope.theme+'-primary-'+$scope.background2});
    $mdColors.applyThemeColors(angular.element( document.querySelector('#sideNav')), {'backgroundColor':  $scope.theme+'-primary-'+$scope.background2});
    $mdColors.applyThemeColors(angular.element( document.querySelector('#sideNavContent')), {'backgroundColor':  $scope.theme+'-primary-'+$scope.background2});
    if (angular.isDefined(item)) {
      $route.reload();
    }
  };

  $scope.navLinks = [
    {
      label: 'Albums',
      icon: 'album',
      action: function() {
        $location.path('/albums');
      }
    },{
      label: 'Playlists',
      icon: 'my_library_music',
      action: function() {
        $location.path('/playlists');
      }
    },{
      label: 'Queue',
      icon: 'queue_music',
      action: function() {
        $location.path('/queue');
      }
    },{
      label: 'Settings',
      icon: 'settings',
      action: function() {
        $location.path('/settings');
      }
    }
  ];

  $rootScope.$on("$routeChangeStart", function(event, next, current) {
    $scope.lastPage = $scope.selectedPage;
    $scope.loading = true;
  });
  $rootScope.$on("$routeChangeSuccess", function(event, current, previous) {
    $scope.selectedPage = $location.path().split('/')[1];
    $scope.loading = false;
  });
  $rootScope.$on("$routeChangeError", function(event, current, previous, rejection) {
    $scope.selectedPage = $location.path().split('/')[1];
    $scope.loading = false;
  });
});
