angular.module('hsEditTracks', ['ngRoute'])
    .controller('editTrack', function ($scope,$location, $http) {
        var trackEditForm = document.querySelector('#trackEditForm');
        trackEditForm.addEventListener('submit', e => {
            e.preventDefault();
            var trackid = e.target.getAttribute('trackid');
            var formData = new FormData();
            formData.append('title', document.querySelector('input[name=title]').value);
            formData.append('description', document.querySelector('textarea[name=description]').value);
            formData.append('image', document.querySelector('input[name=image]').files[0]);
            formData.append('private', document.querySelector('input[name=private]').checked);
            ajax.open('POST', `/api/track/edit/${trackid}`);
            ajax.setRequestHeader('token', token);
            ajax.send(formData);
            ajax.onload = function () {
                var response = JSON.parse(ajax.response).track;
                $location.url(`/track/${response.author.username}/${response.title}`);
                $http({
                    method: 'GET',
                    url: `/track/${response.author.username}/${response.title}`
                })
            }
        });
    })
