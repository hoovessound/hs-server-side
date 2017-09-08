'use strict';

var profilePicture = document.querySelector('#profilePicture .icon');
var iconInput = document.querySelector('#profilePicture #iconInput');
var fullname = document.querySelector('#fullname input');
var navUsername = document.querySelector('nav .container-fluid #bs-example-navbar-collapse-1 .nav.navbar-nav.navbar-right .dropdown .dropdown-toggle');
var navImg = document.querySelector('nav .container-fluid #bs-example-navbar-collapse-1 .nav.navbar-nav.navbar-right .dropdown .dropdown-toggle img');

profilePicture.addEventListener('click', function (e) {
    iconInput.click();
});

iconInput.addEventListener('change', function (e) {
    // Upload the pictire
    var file = e.target.files[0];
    var form = new FormData();
    form.append('image', file);
    ajax.open('POST', '/api/settings/profilepicture/upload?bypass=true');
    ajax.setRequestHeader('token', token);
    ajax.setRequestHeader('sessionToken', sessionToken);
    ajax.send(form);
    ajax.onload = function () {
        if (ajax.readyState === 4 && ajax.status === 200) {
            var response = JSON.parse(ajax.response);
            if (response.success) {
                iconInput.value = null;
                navImg.src = response.icon;
            } else {
                document.querySelector('.error').innerHTML = response.msg;
            }
        }
    };
});

fullname.addEventListener('keydown', function (e) {
    if (e.keyCode === 13) {
        // ENTER
        updateFullName(e);
    }
});

fullname.addEventListener('focusout', function (e) {
    updateFullName(e);
});

function updateFullName(e) {
    e.preventDefault();
    ajax.open('POST', '/api/settings?bypass=true');
    ajax.setRequestHeader('token', token);
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.send(JSON.stringify({
        settings: {
            full_name: fullname.value
        }
    }));
    fullname.blur();
    navUsername.innerHTML = fullname.value;
}