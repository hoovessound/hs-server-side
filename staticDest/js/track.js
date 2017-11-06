'use strict';

var faveButton = document.querySelector('.fave');
var shareURL = document.querySelector('.shareURL');
var shareButton = document.querySelector('.share');

faveButton.addEventListener('click', function (e) {
    var el = e.target;
    ajax.open('POST', 'api.' + full_address + '/track/fave/' + trackid + '?bypass=true&oauth_token=' + token);
    ajax.send();
    if (el.classList.contains('isFave')) {
        el.classList.remove('isFave');
    } else {
        el.classList.add('isFave');
    }
});

shareButton.addEventListener('click', function (e) {
    if (shareURL.classList.contains('hide')) {
        shareURL.classList.remove('hide');
    } else {
        shareURL.classList.add('hide');
    }
});

shareURL.addEventListener('click', function (e) {
    shareURL.select();
});