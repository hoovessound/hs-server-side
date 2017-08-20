'use strict';

var form = document.querySelector('#searchForm');
var formInput = document.querySelector('#searchForm [name=query]');

angular.module('hsSearch', ['ngRoute']).controller('search', function ($scope, $location, $http) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        // Get the query
        var query = formInput.value.trim();
        if (query.length > 0) {
            $location.url('/search/' + query);
            $http({
                method: 'GET',
                url: 'api//search/' + query
            });
        }
    });
});