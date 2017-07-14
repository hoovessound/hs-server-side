const profilePicture = document.querySelector('#profilePicture .icon');
const iconInput = document.querySelector('#profilePicture #iconInput');
const fullname = document.querySelector('#fullname');
const ajax = new XMLHttpRequest();

profilePicture.addEventListener('click', e => {
    iconInput.click();
});

iconInput.addEventListener('change', e => {
    // Upload the pictire
    const file = e.target.files[0];
    const form = new FormData();
    form.append('image', file);
    ajax.open('POST', '/api/settings/profilepicture/upload');
    ajax.setRequestHeader('token', token);
    ajax.send(form);
    ajax.onload = function(){
        if(ajax.readyState === 4 && ajax.status === 200){
            const response = JSON.parse(ajax.response);
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