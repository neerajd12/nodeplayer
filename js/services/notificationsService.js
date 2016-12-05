(function () {
  'use strict';
  angular.module('skynetclient.notificationsModule', [])
	.service('Notification', function ($mdToast) {
    var self = this;
    this.primary = function(data){
      $mdToast.show(
        $mdToast.simple()
          .textContent(data)
          .position('top right')
          .hideDelay(3000)
          .theme("warning-toast")
      );
    };
    this.error = function(data){
      $mdToast.show(
        $mdToast.simple()
          .textContent(data)
          .position('top right')
          .hideDelay(3000)
          .theme("error-toast")
      );
    };
    this.warning = function(data){
      $mdToast.show(
        $mdToast.simple()
          .textContent(data)
          .position('top right')
          .hideDelay(3000)
          .theme("warning-toast")
      );
    };
  });
}());
