io.on('notification:new', function (payload) {
    var newNote = document.querySelector('#newNote');
    if(newNote === null){
        // Outside the notification page
        document.querySelector('.notificationButton').classList.add('raining');
        setTimeout(function () {
            document.querySelector('.notificationButton').classList.remove('raining');
        }, 2500);
    }else{
        // Inside the notification page
        var payloadHTML = `<div id="${payload.id}" class="payload">
<img src="${payload.icon || ''}" class="icon">
<p class="title">${payload.title || null}</p>
<a href="${payload.link || null}">
    <spam class="body">${payload.body}</spam>
</a>
</div>`;
            newNote.innerHTML += payloadHTML;
        }
});