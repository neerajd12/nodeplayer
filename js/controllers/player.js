angular.module('skynetclient.playerModule', [])
.controller('playerCtrl',function ($scope, $rootScope, $interval, $location, musicQueue, Notification) {
  $scope.fabOpen = false;
  var trackPoller;

  $scope.playMode = {
    icon : 'repeat',
    value :'Repeat',
    fill:'white',
    setView : function(val) {
      if (val === 'Shuffle') {
        this.value = 'Repeat';
        this.icon = 'repeat';
      } else {
        this.value = 'Shuffle';
        this.icon = 'shuffle';
      }
      localStorage['playMode'] = val;
    }
  };
  $scope.playMode.setView(localStorage['playMode'] || 'Shuffle');

  $scope.viewMode = {
    action: 'showDetails',
    icon: 'keyboard_arrow_up',
    label: 'More',
    fill:'white',
    toggle : function() {
      if (this.action === 'showDetails' ) {
        this.action = 'hideDetails';
        this.icon = 'keyboard_arrow_down';
        this.label = 'Less';
        $location.path('/queue');
      } else {
        this.action = 'showDetails';
        this.icon = 'keyboard_arrow_up';
        this.label = 'More';
        $location.path($scope.lastPage);
      }
    }
  };

  $scope.mediaButtons = {
    playlast: {
      label: 'Play previous',
      icon: 'skip_previous',
      fill:'white',
      action: function() {
        playAudio('last');
      }
    },
    play: {
      label: 'play',
      icon: 'play_arrow',
      fill:'white',
      action : function() {
        if (this.icon === 'play_arrow') {
          if($scope.audio.src === '') {
            startMusic(musicQueue.getCurrent());
          } else if ($scope.audio.paused) {
            $scope.audio.play();
          }
        } else {
          $scope.audio.pause();
        }
      },
      setView: function(label, icon, fill) {
        this.label = label;
        this.icon = icon;
        this.fill = fill;
      }
    },
    playnext: {
      label: 'Play Next',
      icon: 'skip_next',
      fill:'white',
      action: function() {
        playAudio('next');
      }
    },
    volume: {
      label: 'Mute',
      icon: 'volume_up',
      fill:'white',
      action: function() {
        if (this.icon === 'volume_up') {
          $scope.audio.muted = true;
          $scope.volume = 0;
        } else {
          $scope.audio.muted = false;
          $scope.volume = (parseFloat(localStorage["playerVolume"]) || 1)*100;
        }
      },
      updateView: function() {
        if($scope.audio.muted || $scope.volume === 0) {
          this.label = 'unMute';
          this.icon = 'volume_off';
          this.fill = '#c23f3f';
        } else {
          this.label = 'Mute';
          this.icon = 'volume_up';
          this.fill = 'white';
        }
      }
    }
  };

  $scope.audio = new Audio();
  $scope.audio.autoplay = true;
  $scope.audio.defaultMuted = false;

  $scope.audio.onvolumechange = function() {
    $scope.volume = $scope.audio.volume*100;
    $scope.mediaButtons.volume.updateView();
    if (!$scope.audio.muted) {
      localStorage["playerVolume"] = $scope.audio.volume;
    }
  };

  $scope.audio.volume = parseFloat(localStorage["playerVolume"]) || 1;
  $scope.$watch('volume', function(newValue, oldValue) {
    if (newValue != oldValue) {
      $scope.audio.volume = newValue/100;
    }
  });

  $scope.audio.onpause = function() {
    Notification.primary("player paused !!!");
    $scope.mediaButtons.play.setView('play', 'play_arrow', 'white');
  };

  $scope.audio.onended = function() {
    if (angular.isDefined(trackPoller)) {
      $interval.cancel(trackPoller);
      trackPoller = undefined;
    }
    $scope.mediaButtons.play.setView('play', 'play_arrow', 'white');
    playAudio('next');
  };

  $scope.audio.onplaying = function() {
    if (angular.isUndefined(trackPoller)) {
      trackPoller = $interval(function() {
        $scope.track['currentTime'] = $scope.audio.currentTime;
        $scope.track['duration'] = $scope.audio.duration;
      }, 10);
    }
    $scope.mediaButtons.play.setView('Pause', 'pause', '#c23f3f');
  };

  $scope.updateTrackTime = function() {
    $scope.audio.currentTime = $scope.track['currentTime'];
  };

  function resetTrack() {
    $scope.track = {
      title: '',
      fileName: '',
      picture : 'img/album-placeholder.jpg',
      duration : 0,
      currentTime: 0
    };
  };

  function clearAudio() {
    $scope.audio.pause();
    $scope.audio.src='';
    resetTrack();
  };

  function setTrackAndPlay(track, doPlay) {
    if (!track) {
      resetTrack();
      return;
    }
    getTrackByFileName(track).then(function(trk) {
      if (trk) {
        $scope.track = trk;
        $scope.track['currentTime'] = 0;
        if (doPlay && $scope.track.fileName) {
          $scope.audio.src = $scope.track.fileName;
          $scope.audio.play();
          $rootScope.$emit('currentTrackChanged');
        }
      }
    },function(err) {
      resetTrack();
    });
  };

  function startMusic(toPlay) {
    $scope.audio.pause();
    $scope.audio.src='';
    setTrackAndPlay(toPlay, true);
  };

  function playAudio(track) {
    if ($scope.playMode.value === 'Repeat') {
      if (track === 'next') {
        startMusic(musicQueue.getNext());
      } else {
        startMusic(musicQueue.getLast());
      }
    } else {
      startMusic(musicQueue.getRandom());
    }
  };

  $rootScope.$on('queueOrderChanged', function() {
      startMusic(musicQueue.getCurrent());
  });
  $rootScope.$on('queueEmpty', function() {
    clearAudio();
  });
  $rootScope.$on('tracksAdded', function() {
    if ($scope.track.duration == 0) setTrackAndPlay(musicQueue.getCurrent(), false);
  });

  angular.forEach(['INIT', 'UPDATE', 'ADD'], function(eventType) {
    $scope.$on(eventType, function(event) {
      if ($scope.track.duration == 0) setTrackAndPlay(musicQueue.getCurrent(), false);
    });
  });

  angular.forEach(['REMOVE', 'EMPTY'], function(eventType) {
    $scope.$on(eventType, function(event) {
      getTracks().then(function(data) {
        let notRemoved = data.map(function(a){return a.fileName})
        musicQueue.removeTracks(musicQueue.getTracks().filter(function(q){return notRemoved.indexOf(q) == -1}));
      },function(err) {});
    });
  });

  resetTrack();
});
