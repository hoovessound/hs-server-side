'use strict';

angular.module('toEditLink', ['ngRoute']).controller('toEditLink', function ($scope, $location, $http) {
    $scope.toEditLink = function ($event, editing) {
        $event.preventDefault();
        var target = $event.currentTarget;
        var username = target.getAttribute('username');
        var title = target.getAttribute('title');
        var url;
        editing = typeof editing === 'undefined' ? true : false;
        if (editing) {
            url = '/track/' + username + '/' + title + '/edit';
        } else {
            url = '/track/' + username + '/' + title + '/';
        }
        $location.url(url);
    };
});