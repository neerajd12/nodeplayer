angular.module('skynetclient.playerModule', [])
.controller('playerCtrl',function ($scope, $rootScope, $interval, $location, musicQueue, Notification) {
  $scope.fabOpen = false;
  var trackPoller;

  $scope.playMode = {
    icon : 'repeat',
    value :'Repeat',
    fill:'white',
    toggle : function() {
      if (this.value === 'Shuffle') {
        this.value = 'Repeat';
        this.icon = 'repeat';
      } else {
        this.value = 'Shuffle';
        this.icon = 'shuffle';
      }
    }
  };
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
          this.label = 'Pause';
          this.icon = 'pause';
          if($scope.audio.src === ''){
            startMusic(musicQueue.getCurrent());
          } else {
            if ($scope.audio.paused) {
              $scope.audio.play();
            }
          }
        } else {
          this.label = 'play';
          this.icon = 'play_arrow';
          $scope.audio.pause();
        }
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
        if (this.icon === 'volume_off') {
          this.label = 'Mute';
          this.icon = 'volume_up';
          this.fill = 'white',
          $scope.audio.muted = true;
        } else {
          this.label = 'unMute';
          this.icon = 'volume_off';
          this.fill = '#c23f3f',
          $scope.audio.muted = false;
        }
      }
    }
  };

  $scope.audio = new Audio();
  $scope.audio.autoplay = true;
  $scope.audio.defaultMuted = false;
  $scope.audio.volume = parseFloat(localStorage["playerVolume"]) || 1;
  $scope.audio.onvolumechange = function() {
    localStorage["playerVolume"] = $scope.audio.volume;
  };
  $scope.audio.onpause = function() {
    Notification.primary("player paused !!!");
  };
  $scope.audio.onended = function() {
    if (angular.isDefined(trackPoller)) {
      $interval.cancel(trackPoller);
      trackPoller = undefined;
    }
    playAudio('next');
  };
  $scope.audio.onplaying = function() {
    if (angular.isUndefined(trackPoller)) {
      trackPoller = $interval(function() {
        $scope.track['currentTime'] = $scope.audio.currentTime;
        $scope.track['duration'] = $scope.audio.duration;
      }, 10);
    }
  };
  $scope.updateTrackTime = function() {
    $scope.audio.currentTime = $scope.track['currentTime'];
  };

  function setTrack(toPlay) {
    getTrackByFileName(toPlay).then(function(trk) {
      if (trk.length > 0) {
        $scope.track = trk[0];
        $scope.track['currentTime'] = 0;
      } else {
        $scope.track = {
          title: '',
          fileName: '',
          picture : 'img/album-placeholder.jpg',
          duration : 0,
          currentTime: 0
        };
      }
    },function(err){
      console.log(err);
    });
  };

  function clearAudio() {
    $scope.audio.pause();
    $scope.audio.src='';
  };

  function startMusic(toPlay) {
    clearAudio();
    if (toPlay) {
      setTrack(toPlay);
      if ($scope.track.fileName) {
        $scope.audio.src = $scope.track.fileName;
        $scope.audio.play();
        $rootScope.$emit('currentTrackChanged');
      }
    }
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

  $rootScope.$on('trackAddedToTop', function() {
    startMusic(musicQueue.getCurrent());
  });
  $rootScope.$on('queueEmpty', function() {
    setTrack([]);
  });
  $rootScope.$on('musicExist', function() {
    setTrack(musicQueue.getCurrent())
  });
});
