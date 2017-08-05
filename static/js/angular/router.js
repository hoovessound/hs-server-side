angular.module('hsRoutes', ['ngRoute'])
    .config(($routeProvider, $locationProvider) => {
        $routeProvider
            .when('/', {
                redirectTo: '/home',
            })
            .when('/home/:offset?', {
                templateUrl: function ($params) {
                    return `/render/tracks?offset=${ $params.offset ? $params.offset : 0}`;
                },
            })
            .when('/me/fave', {
                templateUrl: '/render/me/fave',
            })
            .when('/upload', {
                templateUrl: '/render/upload',
            })
            .when('/settings', {
                templateUrl: '/render/settings',
            })
            .when('/me', {
                templateUrl: '/render/me',
            })
            .when('/search/:query', {
                templateUrl: function(params){
                    return `/render/search/${params.query}`;
                },
            })
            .when('/user/:username', {
                templateUrl: function(params){
                    return `/render/user/${params.username}`;
                },
            })
            .when(`/track/:username/:title`, {
                templateUrl: function(params){
                    return `/render/track/${params.username}/${params.title}`;
                },
            })
            .when(`/track/:username/:title/edit`, {
                templateUrl: function(params){
                    return `/render/track/${params.username}/${params.title}/edit`;
                },
            })
            .when(`/notification`, {
                templateUrl: '/render/notification',
            })

            // .otherwise({
            //     redirectTo: '/home',
            // });

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    });