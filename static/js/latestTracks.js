var masterTitle = document.querySelector('.masterPlayer .title');
var masterPlayPuaseButton = document.querySelector('.masterPlayer .playPuaseButton');
var volumeBar = document.querySelector('#volumeBar');
var tracksElement = document.querySelector('.tracks');
var container = document.querySelector('.container');
var ajax = new XMLHttpRequest();
var ajaxing = false;
audio.addEventListener('ended', e => {
    masterPlayPuaseButton.innerHTML = 'play_arrow';
});

// volume bar control
volumeBar.addEventListener('input', e => {
    // Thanks https://stackoverflow.com/a/31927281/6511655
    var volume = parseInt(e.target.value);
    audio.volume = volume/ 100;
});

function playMusic(el){
    // Fetch the track info from the API
    var trackID = el.getAttribute('trackid');
    var title = el.getAttribute('title');
    var fullName = el.getAttribute('fullname');
    var username = el.getAttribute('username');
    masterTitle.innerHTML = `${fullName} - ${title}`;
    masterTitle.href = `${$full_address}/track/${username}/${title}`;
    audio.src = `${$full_address}/api/listen/${trackID}?token=${$token}`;
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