var masterTitle = document.querySelector('.masterPlayer .title');
var masterPlayPuaseButton = document.querySelector('.masterPlayer .playPuaseButton');
var masterPlayer = document.querySelector('.masterPlayer');
var masterPlayerTimeStamp = document.querySelector('.masterPlayer .timeStamp');
var volumeBar = document.querySelector('#volumeBar');
var tracksElement = document.querySelector('.tracks');
var container = document.querySelector('.container');
var ajax = new XMLHttpRequest();

audio.addEventListener('ended', e => {
    // When the audio is ended, try to fetch an other track automatically
    masterPlayPuaseButton.innerHTML = 'play_arrow';
    setTimeout(function () {
        // Wait 1 second, and fetch the song ( fade out effect )
        localPlayList.nextTrack();
    }, 1000);
});

io.on('audio:fromserver:change', function(payload) {
    masterTitle.innerHTML = `${payload.fullName} - ${payload.title}`;
    masterPlayer.classList.add('remotePlay');
    masterTitle.href = `/track/${payload.username}/${payload.title}`;
    audio.src = full_address_util.addSubdomain('stream', `/${payload.trackID}`);
    audio.pause();
    masterPlayPuaseButton.innerHTML = 'pause';
});

io.on('audio:fromserver:pause', function(payload) {
    masterPlayer.classList.remove('remotePlay');
    masterPlayPuaseButton.innerHTML = 'play_arrow';
});

io.on('audio:fromserver:play', function(payload) {
    masterPlayer.classList.add('remotePlay');
    masterPlayPuaseButton.innerHTML = 'pause';
});

io.on('audio:fromserver:volume', function(payload) {
    audio.volume = payload.volume / 100;
    volumeBar.value = payload.volume;
});

io.on('audio:fromserver:timeupdate', function (payload) {
    masterPlayerTimeStamp.value = payload.playtime.currentTime;
    audio.currentTime = payload.playtime.currentTime;
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
    masterPlayerTimeStamp.value = 0;
    audio.currentTime = 0;
    masterPlayer.classList.remove('remotePlay');
    // Fetch the track info from the API
    var trackID = el.getAttribute('trackid');
    var title = el.getAttribute('title');
    var fullName = el.getAttribute('fullname');
    var username = el.getAttribute('username');
    masterTitle.innerHTML = `${fullName} - ${title}`;
    masterTitle.href = `track/${username}/${title}`;
    audio.src = full_address_util.addSubdomain('stream', `/${trackID}`);
    audio.play();
    audio.onloadedmetadata = function () {
        masterPlayerTimeStamp.max = audio.duration;
    }
    masterPlayPuaseButton.innerHTML = 'pause';
    io.emit('audio:toserver:new', {
        trackID: trackID,
        title: title,
        fullName: fullName,
        username: username,
        token: token,
        id: io.id,
        volume: volumeBar.value,
    });
}

masterPlayPuaseButton.onclick = function (e) {
    if(audio.paused) {
        playTheAudio();
    }else{
        pauseTheAudio();
    }
}

audio.ontimeupdate = function () {
    if(!masterPlayer.classList.contains('remotePlay')){
        var currentTime = audio.currentTime;
        masterPlayerTimeStamp.value = currentTime;
        io.emit('audio:toserver:timeupdate', {
            token: token,
            id: io.id,
            playtime: {
                currentTime: audio.currentTime,
                duration: audio.duration,
            }
        });
    }
}

masterPlayerTimeStamp.oninput = function (e) {
    audio.currentTime = masterPlayerTimeStamp.value;
    io.emit('audio:toserver:timeupdate', {
        token: token,
        id: io.id,
        playtime: {
            currentTime: audio.currentTime,
            duration: audio.duration,
        }
    });
}

function pauseTheAudio(e) {
    audio.pause();
    masterPlayPuaseButton.innerHTML = 'play_arrow';
    io.emit('audio:toserver:pause', {
        token: token,
        id: io.id,
    });
}

function playTheAudio(e) {
    audio.play();
    audio.onloadedmetadata = function () {
        masterPlayerTimeStamp.max = audio.duration;
    }
    masterPlayPuaseButton.innerHTML = 'pause';
    io.emit('audio:toserver:play', {
        token: token,
        id: io.id,
    });
}