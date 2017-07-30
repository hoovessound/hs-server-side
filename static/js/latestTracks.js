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

function homePlay() {
    console.log('ahhh')
    masterTitle.innerHTML = `Fuck you`;
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

window.addEventListener('scroll', e => {
    if(window.location.href !== `${full_address}/home`){
        return false;
    }
    let currentPosition = window.pageYOffset + window.innerHeight;
    if(currentPosition > container.offsetHeight / 1.1){
        if(ajaxing === false){
            ajaxing = true;
            if(offset === 0) {
                offset = 10;
            }

            ajax.open('GET', `/api/tracks?offset=${offset}`);
            ajax.setRequestHeader('token', $token);
            ajax.send();
            ajax.onload = function () {
                if(ajax.readyState === 4 && ajax.status === 200){
                    offset += 10;
                    var response = JSON.parse(ajax.response);
                    // Append the tracks into the DOM
                    response.tracks.forEach(track => {
                        var html = `<div id="${track._id}">
                        <img src="${track.coverImage}" alt="" class="coverImage">
                        <div class="playPuaseButton material-icons" fullname="${track.author.fullName}" username="${track.author.username}" title="${track.title}" trackid="${track._id}" onclick="playMusic(this)">play_arrow</div>
                        <a href="/track/${track.author.username}/${track.title}">${track.author.fullName} - ${track.title}</a>
                    </div>`;
                        tracksElement.innerHTML += html;
                        if (history.pushState) {
                            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?offset=${offset}`;
                            window.history.pushState({path:newurl},'',newurl);
                            ajaxing = false;
                        }
                    });
                }
            }
        }
    }
});