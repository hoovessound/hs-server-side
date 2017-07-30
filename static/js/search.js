var form = document.querySelector('#searchForm');
var formInput = document.querySelector('#searchForm [name=query]');

angular.module('hsSearch', ['ngRoute'])
    // .config(function ($provide, $routeProvider) {
    //     $provide.factory('$routeProvider', function () {
    //         return $routeProvider;
    //     });
    // })
    // .run(function ($routeProvider, $http) {
    //     form.addEventListener('submit', e => {
    //         e.preventDefault();
    //         // Get the query
    //         var query = formInput.value.trim();
    //         if(query.length > 0){
    //             if (history.pushState) {
    //                 var newurl = window.location.protocol + "//" + window.location.host +  `/search/${query}`;
    //                 window.history.pushState({path:newurl},'', newurl);
    //             }
    //         }
    //     });
    // })
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

