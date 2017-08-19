var hsAngular = angular.module('hs', [
    'hsRoutes',
    'hsSearch',
    'hsEditTracks',
    'homeTrackLink',
    'toEditLink',
    'masterPlayerTitle',
    'getMoreContent',
    'uploadTrack',
]);

hsAngular.run(function($rootScope) {
    $rootScope.$on("$locationChangeStart", function(event, next, current) {
        localPlayList.clearTrack();
    });
});