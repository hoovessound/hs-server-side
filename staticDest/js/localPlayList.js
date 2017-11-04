'use strict';

var localPlayList = {
    currentIndex: 0,
    playList: [],
    addTrack: function addTrack(id) {
        localPlayList.playList.push(id);
    },
    removeTrack: function removeTrack(id) {
        localPlayList.splice(localPlayList.indexOf(id));
    },
    nextTrack: function nextTrack() {
        if (localPlayList.playList.length <= 1) {
            pauseTheAudio();
            return false;
        }
        localPlayList.currentIndex += 1;
        // Fetch the track info
        ajax.open('GET', full_address_util.addSubdomain('api', '/track/' + localPlayList.playList[localPlayList.currentIndex] + '?bypass=true'));
        ajax.setRequestHeader('token', token);
        ajax.setRequestHeader('sessionToken', sessionToken);
        ajax.send();
        ajax.onload = function () {
            if (ajax.readyState === 4 && ajax.status === 200) {
                var response = JSON.parse(ajax.response);
                // Create that track element for the playMusic function
                var musicElement = document.createElement('div');
                musicElement.setAttribute('fullname', response.author.fullName);
                musicElement.setAttribute('username', response.author.username);
                musicElement.setAttribute('title', response.title);
                musicElement.setAttribute('trackid', response._id);
                playMusic(musicElement);
            }
        };
    },
    clearTrack: function clearTrack() {
        localPlayList.currentIndex = 0;
        localPlayList.playList = [];
    }
};