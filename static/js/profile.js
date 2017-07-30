function playMusic(el){
    // Fetch the track info from the API
    var trackID = el.getAttribute('trackid');
    var title = el.getAttribute('title');
    var fullName = el.getAttribute('fullname');
    var username = el.getAttribute('username');
    masterTitle.innerHTML = `${fullName} - ${title}`;
    masterTitle.href = `${$full_address}/track/${username}/${title}`;
    audio.src = `${$full_address}/api/listen/${trackID}?token=${token}`;
    audio.play();
    masterPlayPuaseButton.innerHTML = 'pause';
}

masterPlayPuaseButton.addEventListener('click', e => {
    if(!audio.paused){
        audio.pause();
        masterPlayPuaseButton.innerHTML = 'play_arrow';
    }else{
        audio.play();
        masterPlayPuaseButton.innerHTML = 'pause';
    }
});

audio.addEventListener('ended', e => {
    masterPlayPuaseButton.innerHTML = 'play_arrow';
});