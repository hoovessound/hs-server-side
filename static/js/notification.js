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
<div class="removeMessage material-icons" payloadId="${payload.id}" onclick="removePayload(event);">delete</div>
</div>`;
            newNote.innerHTML += payloadHTML;
        }

});

function removePayload(e) {
    e.preventDefault();
    var target = e.target;
    var id = target.getAttribute('payloadId');
    ajax.open('POST', `${full_address}/api/notification/remove`);
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.setRequestHeader('token', token);
    ajax.send(JSON.stringify({
        id,
    }));
    ajax.onload = function () {
        if(ajax.status === 200 && ajax.readyState === 4){
            var response = JSON.parse(ajax.response);
            // Remove the element from eh DOM
            function remove(id) {
                var elem = document.getElementById(id);
                return elem.parentNode.removeChild(elem);
            }
            remove(response.id)
        }
    }
}