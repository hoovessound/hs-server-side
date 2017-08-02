angular.module('homeTrackLink', ['ngRoute'])
    .controller('homeTrackLink', function ($scope,$location, $http) {
        $scope.homeTrackLink = function ($event) {
            $event.preventDefault();
            var target = $event.currentTarget;
            var username = target.getAttribute('username');
            var title = target.getAttribute('title');
            $location.url(`/track/${username}/${title}`);
            $http({
                method: 'GET',
                url: `/track/${username}/${title}`
            })
        }
    })