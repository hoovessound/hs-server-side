var faveButton = document.querySelector('.fave');
var shareURL = document.querySelector('.shareURL');
var shareButton = document.querySelector('.share');

faveButton.addEventListener('click', e => {
    var el = e.target;
    ajax.open('POST', `/api/track/fave/${trackid}?bypass=true`);
    ajax.setRequestHeader('token', token);
    ajax.send();
    ajax.onload = function () {
        if(ajax.status === 200 && ajax.readyState === 4){
            if(el.classList.contains('isFave')){
                el.classList.remove('isFave');
            }else{
                el.classList.add('isFave');
            }
        }
    }
});

audio.addEventListener('ended', e => {
    masterPlayPuaseButton.innerHTML = 'play_arrow';
});

shareButton.addEventListener('click', e => {
    if(shareURL.classList.contains('hide')){
        shareURL.classList.remove('hide');
    }else{
        shareURL.classList.add('hide');
    }
});

shareURL.addEventListener('click', e => {
    shareURL.select();
});