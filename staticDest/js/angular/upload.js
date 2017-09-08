'use strict';

angular.module('uploadTrack', ['ngRoute']).controller('uploadTrack', function ($scope, $location, $http) {

    var fileInput = document.querySelector('#file');
    var coverImage = document.querySelector('#image');
    var uploadForm = document.querySelector('#uploadForm');
    var progressBar = document.querySelector('.progress .progress-bar');
    var errorMessgae = document.querySelector('.error');
    var title = document.querySelector('#title');
    var description = document.querySelector('#description');
    var uploadAjax = new XMLHttpRequest();
    fileInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        // Set the title
        var fileName = file.name;
        fileName = fileName.split('.')[0];
        fileName = fileName.replace(/\W/igm, '');
        fileName = fileName.replace(/ /igm, '-');
        title.value = fileName;
    });

    uploadForm.onsubmit = function (e) {
        // Upload the file
        e.preventDefault();
        errorMessgae.innerHTML = 'We are uploading your track now';
        if (fileInput.files[0]) {
            var file = fileInput.files[0];
            var form = new FormData();
            uploadAjax.open('POST', '/api/upload');
            form.append('audio', file);
            form.append('title', title.value);
            form.append('description', description.value);
            form.append('image', coverImage.files[0]);
            uploadAjax.setRequestHeader('token', $token);
            uploadAjax.send(form);
            uploadAjax.onload = function () {
                if (uploadAjax.readyState === 4 && uploadAjax.status === 200) {
                    var response = JSON.parse(uploadAjax.response);
                    if (response.error) {
                        errorMessgae.innerHTML = response.msg;
                    } else {
                        $location.url('/home');
                        $http({
                            method: 'GET',
                            url: '/home'
                        });
                    }
                }
            };

            uploadAjax.upload.addEventListener("progress", function (evt) {
                var percentLoaded = evt.loaded / evt.total * 100;
                progressBar.style.width = percentLoaded + '%';
            }, false);
        }
    };
});