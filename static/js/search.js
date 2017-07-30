var form = document.querySelector('#searchForm');
var formInput = document.querySelector('#searchForm [name=query]');

angular.module('hsSearch', ['ngRoute'])
    .controller('search', function ($scope,$location, $http) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            // Get the query
            var query = formInput.value.trim();
            if(query.length > 0){
                $location.url(`/search/${query}`);
                $http({
                    method: 'GET',
                    url: `/search/${query}`
                })
            }
        });
    })

function playMusic(el){
    // Fetch the track info from the API
    var trackID = el.getAttribute('trackid');
    var title = el.getAttribute('title');
    var fullName = el.getAttribute('fullname');
    const username = el.getAttribute('username');
    audio.src = `${$full_address}/api/listen/${trackID}?token=${token}`;
    audio.play();
}

