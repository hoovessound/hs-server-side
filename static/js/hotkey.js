window.addEventListener('keypress', e => {
    // Check if the user is inputting
    const active = document.activeElement;
    if(active.tagName !== 'TEXTAREA' && active.tagName !== 'INPUT'){
        e.preventDefault();

        // Play pause the audio
        if(e.keyCode === 32){
            if(isPlaying){
                audio.pause();
                masterPlayPuaseButton.innerHTML = 'play_arrow';
                isPlaying = false;
            }else{
                audio.play();
                masterPlayPuaseButton.innerHTML = 'pause';
                isPlaying = true;
            }
        }
    }
});