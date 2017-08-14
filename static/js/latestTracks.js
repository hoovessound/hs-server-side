var masterTitle = document.querySelector('.masterPlayer .title');
var masterPlayPuaseButton = document.querySelector('.masterPlayer .playPuaseButton');
var masterPlayer = document.querySelector('.masterPlayer');
var volumeBar = document.querySelector('#volumeBar');
var tracksElement = document.querySelector('.tracks');
var container = document.querySelector('.container');
var ajax = new XMLHttpRequest();
var ajaxing = false;
audio.addEventListener('ended', e => {
    masterPlayPuaseButton.innerHTML = 'play_arrow';
});

io.on('audio:fromserver:change', function(payload) {
    masterTitle.innerHTML = `${payload.fullName} - ${payload.title} (Remote)`;
    masterPlayer.classList.add('remotePlay');
    masterTitle.href = `${$full_address}/track/${payload.username}/${payload.title}`;
    audio.src = `${$full_address}/api/listen/${payload.trackID}?token=${$token}`;
    audio.pause();
    masterPlayPuaseButton.innerHTML = 'pause';
});

io.on('audio:fromserver:pause', function(payload) {
    masterPlayPuaseButton.innerHTML = 'play_arrow';
});

io.on('audio:fromserver:play', function(payload) {
    masterPlayPuaseButton.innerHTML = 'pause';
});

io.on('audio:fromserver:volume', function(payload) {
    audio.volume = payload.volume / 100;
    volumeBar.value = payload.volume;
});

// volume bar control
volumeBar.addEventListener('input', e => {
    // Thanks https://stackoverflow.com/a/31927281/6511655
    var volume = parseInt(e.target.value);
    audio.volume = volume/ 100;
    io.emit('audio:toserver:volume', {
        token: token,
        id: io.id,
        volume: volume,
    });
});

function playMusic(el){
    masterPlayer.classList.remove('remotePlay');
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
    io.emit('audio:toserver:new', {
        trackID: trackID,
        title: title,
        fullName: fullName,
        username: username,
        token: token,
        id: io.id,
    });
}

masterPlayPuaseButton.addEventListener('click', e => {
    if(!audio.paused){
        pauseTheAudio();
    }else{
        playTheAudio();
    }
});

function pauseTheAudio() {
    audio.pause();
    masterPlayPuaseButton.innerHTML = 'play_arrow';
    io.emit('audio:toserver:pause', {
        token: token,
        id: io.id,
    });
}

function playTheAudio(e) {
    audio.play();
    masterPlayPuaseButton.innerHTML = 'pause';
    io.emit('audio:toserver:start', {
        token: token,
        id: io.id,
    });
}