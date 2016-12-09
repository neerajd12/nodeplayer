'use strict';
angular.module('skynetclient.musicServiceModule', [])
.service('musicQueue', function ($rootScope, Notification) {
  const self = this;
  this.lastTrack = -1;
  this.getCurrentTrackNum  = function() {
    return parseInt(localStorage["currentTrack"] || 0, 10);
  };
  this.getTracks = function() {
    return JSON.parse(localStorage["queue"] || "[]");
  };
  this.getCurrent = function() {
    return self.getTracks()[self.getCurrentTrackNum()];
  };
  this.getNext = function() {
    if(self.getCurrentTrackNum() >= (self.getTracks().length - 1)){
      self.updateCurrentTrackNum(0);
    }else {
      self.updateCurrentTrackNum(self.getCurrentTrackNum() + 1);
    }
    return self.getCurrent();
  };
  this.getLast = function() {
    if (self.getCurrentTrackNum() === 0) {
      self.updateCurrentTrackNum(self.getTracks().length - 1);
    } else {
      self.updateCurrentTrackNum(self.getCurrentTrackNum() - 1);
    }
    return self.getCurrent();
  };
  this.getRandom = function() {
    self.updateCurrentTrackNum(self.getRandomArbitrary(0, self.getTracks().length));
    return self.getCurrent();
  };
  this.updateTracks  = function(tracks) {
    localStorage["queue"] = JSON.stringify(tracks);
  };
  this.updateCurrentTrackNum  = function(index) {
    self.lastTrack = self.getCurrentTrackNum();
    localStorage["currentTrack"] = index;
  };
  this.reCalibrateQ = function(newTracks, front) {
    self.updateTracks(newTracks);
    if (front) {
      self.updateCurrentTrackNum(0);
      $rootScope.$emit('trackAddedToTop');
    }
    Notification.primary("Added to queue !!!");
  }
  this.addTrackToTop = function(newTrack){
    let existing = self.getTracks();
    if (existing.indexOf(newTrack) == -1) {
      existing.unshift(newTrack);
      self.reCalibrateQ(existing, true);
    }
  };
  this.prependQueue = function(newTracks) {
    let existing = self.getTracks();
    existing = newTracks.filter(function(val){return existing.indexOf(val) == -1}).concat(existing);
    self.reCalibrateQ(existing, true);
   };
  this.addTrack = function(newTrack) {
    let existing = self.getTracks();
    if (existing.indexOf(newTrack) == -1) {
      existing.push(newTrack);
      self.reCalibrateQ(existing, false);
    }
  };
  this.appendQueue = function(newTracks) {
    let existing = self.getTracks();
    existing = existing.concat(newTracks.filter(function(val){return existing.indexOf(val) == -1}))
    self.reCalibrateQ(existing, false);
  };
  this.removeTrack = function(trackToRemove, showNotification) {
    let existing = self.getTracks();
    let index = existing.indexOf(trackToRemove);
    if (index > -1) {
      existing.splice(index, 1);
    }
    self.updateTracks(existing);
    if(existing.length < 1) {
      self.updateCurrentTrackNum(0);
      self.lastTrack = -1;
      $rootScope.$emit('queueEmpty');
    }
    if (showNotification) {
      Notification.primary("Track Removed from queue !!!");
    }
  };
  this.removeTracks = function(tracksToRemove) {
    tracksToRemove.forEach(function(element, index, array){
      if (index == array.length - 1) {
        self.removeTrack(element, true);
      } else {
        self.removeTrack(element, false);
      }
    });
  };
  this.clearTracks = function() {
    self.updateTracks([]);
    self.updateCurrentTrackNum(0);
    self.lastTrack = -1;
    Notification.primary("Queue cleared !!!");
    $rootScope.$emit('queueEmpty');
  };
  this.getRandomArbitrary = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };
})
.factory('buttonFactory', function($mdDialog, musicQueue, Notification) {
  var showSavePlaylistDialog = function(tracks, trackId, button) {
    getPlayLists().then(function(doc){
      $mdDialog.show({
        controller: function ($scope, $rootScope, $mdDialog) {
          $scope.theme = $rootScope.theme;
          $scope.existingPlaylists = doc;
          $scope.cancel = function () {
            $mdDialog.cancel();
          };
          $scope.save = function () {
            $mdDialog.hide($scope.playlistTitle);
          };
        },
        templateUrl: 'templates/savePlaylist.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true
      }).then(function(playlistId) {
        if (trackId) {
          addTrackToPlayList([tracks], playlistId);
        } else {
          addTracksToPlayList(tracks, playlistId);
        }
        Notification.primary("saved to playlist");
      }, function(answer) {});
    },function(err){

    });
  };
	return {
    getMusicButtons : function() {
      return [
        { label: 'Play',
          icon: 'play_arrow',
          color: 'md-accent md-hue-3',
          fill:'white',
          visible: true,
          action: function(tracks, trackId) {
            if (trackId) {
              musicQueue.addTrackToTop(tracks.fileName);
            } else {
              musicQueue.prependQueue(tracks.map(function(track){return track.fileName}));
            }
          }
        },
        { label: 'Add to Queue',
          icon: 'add_to_queue',
          color: 'md-accent md-hue-3',
          fill:'white',
          visible: true,
          action: function(tracks, trackId) {
            if (this.label === 'Add to Queue') {
              if (trackId) {
                musicQueue.addTrack(tracks.fileName);
              } else {
                musicQueue.appendQueue(tracks.map(function(track){return track.fileName}));
              }
              this.label = 'Clear Queue';
              this.icon = 'remove_from_queue';
              this.color = 'md-warn';
            } else {
              if (trackId) {
                musicQueue.removeTrack(tracks.fileName, true);
              } else {
                musicQueue.removeTracks(tracks.map(function(track){return track.fileName}));
              }
              this.label = 'Add to Queue';
              this.icon = 'queue_music';
              this.color = 'md-accent md-hue-3';
            }
          }
        },
        { label: 'Add to playlist',
          icon: 'playlist_add',
          color: 'md-accent md-hue-3',
          fill: 'white',
          visible: true,
          action: function(tracks, trackId) {
            if (this.label === 'Add to playlist') {
              showSavePlaylistDialog(tracks, trackId, this);
            }
          }
        },
        { label: 'Add to Favorite',
          icon: 'favorite_border',
          color: 'md-accent md-hue-3',
          fill:'#c23f3f',
          visible: true,
          action: function(tracks, trackId) {}
        }
      ];
    }
  };
});
