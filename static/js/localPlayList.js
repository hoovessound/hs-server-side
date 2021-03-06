var localPlayList = {
    currentIndex: 0,
    playList: [],
    addTrack: function (id) {
        localPlayList.playList.push(id);
    },
    removeTrack: function (id) {
        localPlayList.splice(localPlayList.indexOf(id));
    },
    nextTrack: function () {
        if(localPlayList.playList.length <= 1){
            pauseTheAudio();
            return false;
        }
        localPlayList.currentIndex += 1;
        // Fetch the track info
        ajax.open('GET', full_address_util.addSubdomain('api', `/track/${localPlayList.playList[localPlayList.currentIndex]}?bypass=true&oauth_token=${token}`));
        ajax.send();
        ajax.onload = function () {
            if(ajax.readyState === 4 && ajax.status === 200) {
                var response = JSON.parse(ajax.response);
                // Create that track element for the playMusic function
                var musicElement = document.createElement('div');
                musicElement.setAttribute('fullname', response.author.fullName);
                musicElement.setAttribute('username', response.author.username);
                musicElement.setAttribute('title', response.title);
                musicElement.setAttribute('trackid', response._id);
                playMusic(musicElement);
            }
        }
    },
    clearTrack: function () {
        localPlayList.currentIndex = 0;
        localPlayList.playList = [];
    }
}