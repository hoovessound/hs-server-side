'use strict';

var hsAngular = angular.module('hs', ['hsRoutes', 'hsSearch', 'hsEditTracks', 'homeTrackLink', 'toEditLink', 'masterPlayerTitle', 'getMoreContent', 'uploadTrack']);

hsAngular.run(function ($rootScope) {
    $rootScope.$on("$locationChangeStart", function (event, next, current) {
        localPlayList.clearTrack();
    });
});

hsAngular.run(function ($rootScope, $templateCache) {
    $rootScope.$on('$viewContentLoaded', function () {
        $templateCache.removeAll();
    });
});