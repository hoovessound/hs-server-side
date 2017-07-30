var profilePicture = document.querySelector('#profilePicture .icon');
var iconInput = document.querySelector('#profilePicture #iconInput');
var fullname = document.querySelector('#fullname');

profilePicture.addEventListener('click', e => {
    iconInput.click();
});

iconInput.addEventListener('change', e => {
    // Upload the pictire
    var file = e.target.files[0];
    var form = new FormData();
    form.append('image', file);
    ajax.open('POST', '/api/settings/profilepicture/upload');
    ajax.setRequestHeader('token', token);
    ajax.send(form);
    ajax.onload = function(){
        if(ajax.readyState === 4 && ajax.status === 200){
            var response = JSON.parse(ajax.response);
            console.log(response)
            if(response.success){
                iconInput.value = null;
                window.open('/', '_self');
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
    ajax.open('POST', '/api/settings');
    ajax.setRequestHeader('token', token);
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.send(JSON.stringify({
        settings: {
            full_name: fullname.textContent,
        }
    }));
    fullname.blur();
}