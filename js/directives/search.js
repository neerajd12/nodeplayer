angular.module('skynetclient.searchModule', [])
.directive('searchUi', ['$document', function($document) {
  var searchCtrl = ['$scope', '$location', 'musicService', function ($scope, $location, musicService) {
    $scope.searchResults;

    $scope.searchTextChange = function(searchText) {
      musicService.searchTracks(searchText).then(function(data) {
        $scope.searchResults = data;
      },function(err) {
        console.log(err);
      });
    };

    $scope.searchSelectedItemChange = function(item) {
      if(item) {
        if(item.albumId) {
          $location.path("album/"+item.albumId+"/song/"+item.title);
        } else {
          $location.path("album/"+item.id);
        }
      }
    };
  }];
  return {
    restrict: 'AEC',
    replace: true,
    controller : searchCtrl,
    templateUrl: 'templates/searchbox.html'
  };
}]);
