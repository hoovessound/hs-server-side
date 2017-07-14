let isPlaying = false;
const masterTitle = document.querySelector('.masterPlayer .title');
const masterPlayPuaseButton = document.querySelector('.masterPlayer .playPuaseButton');
const volumeBar = document.querySelector('#volumeBar');

// volume bar control
volumeBar.addEventListener('input', e => {
    const volume = e.target.value;
    audio.volume = `0.${volume}`;
});

function playMusic(el){
    // Fetch the track info from the API
    const trackID = el.getAttribute('trackid');
    const title = el.getAttribute('title');
    const fullName = el.getAttribute('fullname');
    const username = el.getAttribute('username');
    masterTitle.innerHTML = `${fullName} - ${title}`;
    masterTitle.href = `${$full_address}/track/${username}/${title}`;
    audio.src = `${$full_address}/api/listen/${trackID}`;
    audio.play();
    isPlaying = true;
    masterPlayPuaseButton.innerHTML = 'pause';
}

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