window.addEventListener('keypress', e => {
    // Check if the user is inputting
    var active = document.activeElement;
    if(active.tagName !== 'TEXTAREA' && active.tagName !== 'INPUT' && active.id !== 'volumeBar'){
        e.preventDefault();
        // Play pause the audio
        if(e.keyCode === 32){

            if(!audio.paused){
                pauseTheAudio();
            }else{
                playTheAudio();
            }
        }
    }
});