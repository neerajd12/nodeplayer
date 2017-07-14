'use strict';
angular.module('skynetclient.navigationModule',[])
.controller('navCtrl',function ($scope, $rootScope, $location) {

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
