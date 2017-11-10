var profilePicture = document.querySelector('#profilePicture .icon');
var iconInput = document.querySelector('#profilePicture #iconInput');
var fullname = document.querySelector('#fullname input');
const navUsername = document.querySelector('nav .container-fluid #bs-example-navbar-collapse-1 .nav.navbar-nav.navbar-right .dropdown .dropdown-toggle');
const navImg = document.querySelector('nav .container-fluid #bs-example-navbar-collapse-1 .nav.navbar-nav.navbar-right .dropdown .dropdown-toggle img');

profilePicture.addEventListener('click', e => {
    iconInput.click();
});

iconInput.addEventListener('change', e => {
    // Upload the pictire
    var file = e.target.files[0];
    var form = new FormData();
    form.append('image', file);
    ajax.open('POST', full_address_util.addSubdomain('api', `/settings/profilepicture?bypass=true&oauth_token=${token}`));
    ajax.send(form);
    ajax.onload = function(){
        if(ajax.readyState === 4 && ajax.status === 200){
            var response = JSON.parse(ajax.response);
            if(!response.error){
                iconInput.value = null;
                navImg.src = response.icon;
            }else{
                new Noty({
                    text: `ERROR: ${response.error}`,
                    animation: {
                        open: 'animated bounceInRight', // Animate.css class names
                        close: 'animated bounceOutRight' // Animate.css class names
                    },
                    type: 'error',
                    timeout: 3500
                })
                .show();
            }
        }
    }
});

fullname.addEventListener('keydown', e => {
    if(e.keyCode === 13){
        // ENTER
        updateFullName(e);
    }
});

fullname.addEventListener('focusout', e => {
    updateFullName(e);
});

function updateFullName(e) {
    e.preventDefault();
    ajax.open('POST', full_address_util.addSubdomain('api', `/settings?bypass=true&oauth_token=${token}`));
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.send(JSON.stringify({
        settings: {
            full_name: fullname.value,
        }
    }));
    fullname.blur();
}