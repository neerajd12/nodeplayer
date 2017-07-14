(function () {
  'use strict';
  var app = angular.module('skynetclient', [
    'ngMaterial',
    'ngMdIcons',
    'ngRoute',
    'ngAnimate',
    'skynetclient.app',
    'skynetclient.albumsModule',
    'skynetclient.musicQueueModule',
    'skynetclient.detailsViewModule',
    'skynetclient.playlistsModule',
    'skynetclient.musicServiceModule',
    'skynetclient.settingsModule',
    'skynetclient.notificationsModule',
    'skynetclient.playerModule',
    'skynetclient.navigationModule',
    'skynetclient.searchModule',
    'skynetclient.themeModule'])
    .config(['$routeProvider', '$httpProvider', '$mdThemingProvider', 'themeSetProvider',
     function ($routeProvider, $httpProvider, $mdThemingProvider, themeSetProvider) {
      $routeProvider
        .when('/albums', {
          templateUrl : 'templates/albums.html',
          controller: 'albumsCtrl',
          resolve: {
            collection: function(){
              return getAlbums();
            }
          }
        })
        .when('/playlists', {
          templateUrl : 'templates/playlists.html',
          controller: 'playlistsCtrl',
          resolve: {
            playlists: function(){
              return getPlayLists();
            }
          }
        })
        .when('/settings', {
          templateUrl : 'templates/settings.html',
          controller: 'settingsCtrl'
        })
        .when('/queue', {
          templateUrl : 'templates/details.html',
          controller: 'musicQueueCtrl',
          resolve: {
            trackData: function(musicQueue) {
              return getTracksByFileNames(musicQueue.getTracks());
            },
            coverData: function() {
              return [];
            },
            favData: function() {
              return getFavs();
            }
          }
        })
        .when('/albums/:albumId/song/:songName', {
          templateUrl: 'templates/details.html',
          controller: 'albumsDetailsCtrl',
          resolve: {
            coverData: function($route) {
              return getAlbumById($route.current.params.albumId);
            },
            trackData: function($route){
              return getTracksByAlbumId($route.current.params.albumId);
            },
            favData: function($route) {
              return getFavs();
            }
          }
        })
        .when('/playlists/:playlistId', {
          templateUrl : 'templates/details.html',
          controller: 'playlistDetailsCtrl',
          resolve: {
            trackData : function($route) {
              return getPlaylistTracks($route.current.params.playlistId);
            },
            coverData: function($route) {
              return [];
            },
            favData: function() {
              return getFavs();
            }
          }
        })
        .otherwise({
          redirectTo: "/albums"
        });
    }])
    .run(function($rootScope, themeService) {
      /*$rootScope.$on("$includeContentLoaded", function(event, templateName){
        themeService.applyDefault();
      });*/
    });
}());
