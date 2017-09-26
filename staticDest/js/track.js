'use strict';

var faveButton = document.querySelector('.fave');
var shareURL = document.querySelector('.shareURL');
var shareButton = document.querySelector('.share');

faveButton.addEventListener('click', function (e) {
    var el = e.target;
    ajax.open('POST', '/api/track/fave/' + trackid + '?bypass=true');
    ajax.setRequestHeader('token', token);
    ajax.setRequestHeader('sessionToken', sessionToken);
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