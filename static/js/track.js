var volumeBar = document.querySelector('#volumeBar');
var faveButton = document.querySelector('.fave');
var shareURL = document.querySelector('.shareURL');
var shareButton = document.querySelector('.share');
var playPauseButton = document.querySelector('.playPuaseButton');

// volume bar control
volumeBar.addEventListener('input', e => {
    // Thanks https://stackoverflow.com/a/31927281/6511655
    let volume = parseInt(e.target.value);
    audio.volume = volume/ 100;
});

faveButton.addEventListener('click', e => {
    var el = e.target;
    ajax.open('POST', `/api/track/fave/${trackid}`);
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