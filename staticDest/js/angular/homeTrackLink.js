'use strict';

angular.module('homeTrackLink', ['ngRoute']).controller('homeTrackLink', function ($scope, $location, $http) {
    $scope.homeTrackLink = function ($event) {
        $event.preventDefault();
        var target = $event.currentTarget;
        var username = target.getAttribute('username');
        var title = target.getAttribute('title');
        var trackId = target.getAttribute('trackId');
        $location.url('/track/' + trackId);
    };
});