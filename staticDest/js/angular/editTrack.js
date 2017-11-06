'use strict';

angular.module('hsEditTracks', ['ngRoute']).controller('editTrack', function ($scope, $location, $http) {
    var trackEditForm = document.querySelector('#trackEditForm');
    trackEditForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var trackid = e.target.getAttribute('trackid');
        var formData = new FormData();
        formData.append('title', document.querySelector('input[name=title]').value);
        formData.append('description', document.querySelector('textarea[name=description]').value);
        formData.append('image', document.querySelector('input[name=image]').files[0]);
        formData.append('private', document.querySelector('input[name=private]').checked);
        ajax.open('POST', full_address_util.addSubdomain('api', '/track/edit/' + trackid + '?bypass=true&oauth_token=' + token));
        ajax.send(formData);
        ajax.onload = function () {
            var response = JSON.parse(ajax.response).track;
            if (!response.error) {
                $location.url('/track/' + response.author.username + '/' + response.title);
                $http({
                    method: 'GET',
                    url: '/track/' + response.author.username + '/' + response.title
                });
            } else {
                new Noty({
                    text: 'ERROR: ' + response.msg,
                    animation: {
                        open: 'animated bounceInRight', // Animate.css class names
                        close: 'animated bounceOutRight' // Animate.css class names
                    },
                    type: 'error',
                    timeout: 3500
                }).show();
            }
        };
    });
});