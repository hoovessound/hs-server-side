const form = document.querySelector('#searchForm');
const formInput = document.querySelector('#searchForm [name=query]');
form.addEventListener('submit', e => {
    e.preventDefault();
    // Get the query
    const query = formInput.value.trim();
    if(query.length > 0){
        window.open(`/search?query=${query}`, '_self');
    }
});

function playMusic(el){
    // Fetch the track info from the API
    const trackID = el.getAttribute('trackid');
    const title = el.getAttribute('title');
    const fullName = el.getAttribute('fullname');
    const username = el.getAttribute('username');
    audio.src = `${$full_address}/api/listen/${trackID}?token=${token}`;
    audio.play();
    isPlaying = true;
}