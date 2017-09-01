'use strict';

angular.module('hsRoutes', ['ngRoute']).config(function ($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
        redirectTo: '/home'
    }).when('/home/:offset?', {
        templateUrl: function templateUrl($params) {
            return '/render/tracks?offset=' + ($params.offset ? $params.offset : 0);
        },
        reloadOnSearch: false
    }).when('/me/fave', {
        templateUrl: '/render/me/fave'
    }).when('/upload', {
        templateUrl: '/render/upload'
    }).when('/settings', {
        templateUrl: '/render/settings'
    }).when('/me', {
        templateUrl: '/render/me'
    }).when('/search/:query', {
        templateUrl: function templateUrl(params) {
            return '/render/search/' + params.query;
        }
    }).when('/user/:username', {
        templateUrl: function templateUrl(params) {
            return '/render/user/' + params.username;
        }
    }).when('/track/:username/:title', {
        templateUrl: function templateUrl(params) {
            return '/render/track/' + params.username + '/' + params.title;
        }
    }).when('/track/:username/:title/edit', {
        templateUrl: function templateUrl(params) {
            return '/render/track/' + params.username + '/' + params.title + '/edit';
        }
    }).when('/notification', {
        templateUrl: '/render/notification'
    }).when('/@:username', {
        templateUrl: function templateUrl(params) {
            return '/render/user/' + params.username;
        }
    }).otherwise({
        templateUrl: '/error/404'
    });
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
});