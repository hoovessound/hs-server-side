'use strict';

angular.module('getMoreContent', ['ngRoute', 'ngLocationUpdate']).controller('getMoreContent', function ($scope, $location, $http) {
    var loadMoreButton = document.querySelector('.btn.btn-default.loadMore');
    loadMoreButton.addEventListener('click', function (e) {
        e.preventDefault();
        if (offset === 0) {
            offset = 10;
        }
        $http({
            method: 'GET',
            url: '/api/tracks?offset=' + offset + '&bypass=true',
            headers: {
                token: token
            }
        }).then(function (data) {
            offset += 10;
            data.data.tracks.forEach(function (track, index) {
                var html = '<div id="' + track._id + '" style="background-image: url(' + track.coverImage + ');" class="trackContainer">\n                        <div class="playPuaseButton material-icons" fullname="' + track.author.fullName + '" username="' + track.author.username + '" title="' + track.title + '" trackid="' + track._id + '" onclick="playMusic(this)">play_arrow</div>\n                        <a href="' + full_address + '/track/' + track.author.username + '/' + track.title + '" ng-controller="homeTrackLink" ng-click="homeTrackLink($event); $event.stopPropagation();" fullname="' + track.author.fullName + '" username="' + track.author.username + '" title="' + track.title + '" class="trackName">' + track.author.fullName + ' - ' + track.title + '</a>\n                    </div>';
                document.querySelector('.tracks').innerHTML += html;
                if (history.pushState) {
                    if (index === 9) {
                        $location.update_path('/home/' + offset);
                    }
                }
            });
        });
    });
});