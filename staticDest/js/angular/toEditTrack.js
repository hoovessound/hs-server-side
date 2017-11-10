'use strict';

angular.module('toEditLink', ['ngRoute']).controller('toEditLink', function ($scope, $location, $http) {
    $scope.toEditLink = function ($event, editing) {
        $event.preventDefault();
        var target = $event.currentTarget;
        var trackId = target.getAttribute('trackId');
        var url;
        editing = typeof editing === 'undefined' ? true : false;
        if (editing) {
            url = '/track/' + trackId + '/edit';
        } else {
            url = '/track/' + trackId;
        }
        $location.url(url);
    };
});