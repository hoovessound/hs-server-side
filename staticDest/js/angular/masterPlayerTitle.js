'use strict';

angular.module('masterPlayerTitle', ['ngRoute']).controller('masterPlayerTitle', function ($scope, $location, $http) {
    $scope.masterPlayerTitle = function ($event) {
        $event.preventDefault();
        var target = $event.currentTarget;
        var username = target.getAttribute('username');
        var title = target.getAttribute('title');
        var url = '/track/' + username + '/' + title;
        $location.url(url);
        $http({
            method: 'GET',
            url: url
        });
    };
});