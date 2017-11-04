angular.module('getMoreContent', ['ngRoute', 'ngLocationUpdate'])
.controller('getMoreContent', function ($scope, $location, $http) {
    const loadMoreButton = document.querySelector('.btn.btn-default.loadMore');
    loadMoreButton.addEventListener('click', function (e) {
        e.preventDefault();
        if (offset === 0) {
            offset = 10;
        }
        $http({
            method: 'GET',
            url: full_address_util.addSubdomain('api', `/tracks?offset=${offset}&bypass=true`),
            headers: {
                token,
                sessionToken,
            }
        })
        .then(data => {
            if (!data.data.error) {
                offset += 10;
                data.data.tracks.forEach((track, index) => {
                    const html = `<div id="${track._id}" style="background-image: url(${track.coverImage});" class="trackContainer">
                        <div class="playPuaseButton material-icons" fullname="${track.author.fullName}" username="${track.author.username}" title="${track.title}" trackid="${track.id}" onclick="playMusic(this)">play_arrow</div>
                        <a href="/track/${track.author.username}/${track.title}" ng-controller="homeTrackLink" ng-click="homeTrackLink($event); $event.stopPropagation();" fullname="${track.author.fullName}" username="${track.author.username}" title="${track.title}" class="trackName">${track.author.fullName} - ${track.title}</a>
                    </div>`;
                    document.querySelector('.tracks').innerHTML += html;
                    if (history.pushState) {
                        if (index === 9) {
                            $location.update_path(`/home/${offset}`);
                        }
                    }
                });
            } else {
                // Error
                new Noty({
                    text: `ERROR: ${data.data.msg}`,
                    animation: {
                        open: 'animated bounceInRight', // Animate.css class names
                        close: 'animated bounceOutRight' // Animate.css class names
                    },
                    type: 'error',
                    timeout: 3500
                })
                .show();
            }
        })

    });
})
