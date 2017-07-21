let isPlaying = false;
const masterTitle = document.querySelector('.masterPlayer .title');
const masterPlayPuaseButton = document.querySelector('.masterPlayer .playPuaseButton');
const volumeBar = document.querySelector('#volumeBar');
const getNewOne = document.querySelector('#getNewOne');
const tracksElement = document.querySelector('.tracks');
const container = document.querySelector('.container');
const ajax = new XMLHttpRequest();
let ajaxing = false;

// volume bar control
volumeBar.addEventListener('input', e => {
    // Thanks https://stackoverflow.com/a/31927281/6511655
    let volume = parseInt(e.target.value);
    audio.volume = volume/ 100;
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

window.addEventListener('scroll', e => {
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
                    const response = JSON.parse(ajax.response);
                    // Append the tracks into the DOM
                    response.tracks.forEach(track => {
                        const html = `<div id="${track._id}">
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