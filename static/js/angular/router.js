angular.module('hsRoutes', ['ngRoute'])
    .config(($routeProvider, $locationProvider) => {
        $routeProvider
            .when('/', {
                redirectTo: '/home',
            })
            .when('/home', {
                templateUrl: '/render/tracks',
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

            // .otherwise({
            //     redirectTo: '/home',
            // });

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    });