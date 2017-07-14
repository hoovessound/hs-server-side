const volumeBar = document.querySelector('#volumeBar');
const faveButton = document.querySelector('.fave');
let isPlaying = false;
const ajax = new XMLHttpRequest();

const masterPlayPuaseButton = document.querySelector('.masterPlayer .playPuaseButton');
masterPlayPuaseButton.addEventListener('click', e => {
    if(isPlaying){
        audio.pause();
        isPlaying = false;
        masterPlayPuaseButton.innerHTML = 'play_arrow';
    }else{
        audio.play();
        isPlaying = true;
        masterPlayPuaseButton.innerHTML = 'pause';
    }
});

// volume bar control
volumeBar.addEventListener('input', e => {
    const volume = e.target.value;
    audio.volume = `0.${volume}`;
});

faveButton.addEventListener('click', e => {
    const el = e.target;
    ajax.open('POST', `/api/track/fave/${trackid}`);
    ajax.setRequestHeader('token', oauthToken);
    ajax.send();
    ajax.onload = function () {
        if(ajax.status === 200 && ajax.readyState === 4){
            const response = JSON.parse(ajax.response);
            console.log(response)
            if(el.classList.contains('isFave')){
                el.classList.remove('isFave');
            }else{
                el.classList.add('isFave');
            }
        }
    }
});