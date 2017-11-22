var hsAngular = angular.module('hs', [
    'hsRoutes',
    'hsSearch',
    'hsEditTracks',
    'homeTrackLink',
    'toEditLink',
    'masterPlayerTitle',
    'getMoreContent',
    'uploadTrack',
    'track',
]);

hsAngular.run(function($rootScope) {
    $rootScope.$on("$locationChangeStart", function(event, next, current) {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        localPlayList.clearTrack();
        $('#loading').slideDown()
    });
});

hsAngular.run(function($rootScope, $templateCache) {
    $rootScope.$on('$viewContentLoaded', function() {
        $templateCache.removeAll();
        $('#loading').slideUp()
    });
});