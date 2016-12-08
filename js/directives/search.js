angular.module('skynetclient.searchModule', [])
.directive('searchUi', ['$document', function($document) {
  var searchCtrl = ['$scope', '$location', function ($scope, $location) {
    $scope.searchResults;

    $scope.searchTextChange = function(searchText) {
      searchTracks(searchText).then(function(data) {
        $scope.searchResults = data;
      },function(err) {
        console.log(err);
      });
    };

    $scope.searchSelectedItemChange = function(item) {
      $location.path("albums/"+item.albumId+"/song/"+item.title);
    };
  }];
  return {
    restrict: 'AEC',
    replace: true,
    controller : searchCtrl,
    templateUrl: 'templates/searchbox.html'
  };
}]);
