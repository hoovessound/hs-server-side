let isPlaying = false;
const masterTitle = document.querySelector('.masterPlayer .title');
const masterPlayPuaseButton = document.querySelector('.masterPlayer .playPuaseButton');

function playMusic(el){
    // Fetch the track info from the API
    const trackID = el.getAttribute('trackid');
    const title = el.getAttribute('title');
    const fullName = el.getAttribute('fullname');
    const username = el.getAttribute('username');
    masterTitle.innerHTML = `${fullName} - ${title}`;
    masterTitle.href = `${$full_address}/track/${username}/${title}`;
    audio.src = `${$full_address}/api/listen/${trackID}?token=${token}`;
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

audio.addEventListener('ended', e => {
    isPlaying = false;
    masterPlayPuaseButton.innerHTML = 'play_arrow';
});