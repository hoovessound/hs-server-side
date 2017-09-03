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
{icon}
{title}
{body}
<div class="removeMessage material-icons" payloadId="${payload.id}" onclick="removePayload(event);">delete</div>
</div>`;

        if(payload.icon){
            payloadHTML = payloadHTML.replace('{icon}', `<img src="${payload.icon}" class="icon">`);
        }else{
            payloadHTML = payloadHTML.replace('{icon}', '');
        }

        if(payload.title){
            payloadHTML = payloadHTML.replace('{title}', `<p class="title">${payload.title}</p>`);
        }else{
            payloadHTML = payloadHTML.replace('{title}', '');
        }

        if(payload.link){
            payloadHTML = payloadHTML.replace('{body}', `<a href="${payload.link}"><spam class="body">${payload.body}</spam></a>`);
        }else{
            payloadHTML = payloadHTML.replace('{body}', `<spam class="body">${payload.body}</spam>`);
        }

            newNote.innerHTML += payloadHTML;
        }

});

function removePayload(e) {
    e.preventDefault();
    var target = e.target;
    var id = target.getAttribute('payloadId');
    ajax.open('POST', `${full_address}/api/notification/remove?bypass=true`);
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.setRequestHeader('token', token);
    ajax.send(JSON.stringify({
        notificationId: id,
    }));
    ajax.onload = function () {
        if(ajax.status === 200 && ajax.readyState === 4){
            var response = JSON.parse(ajax.response);
            // Remove the element from eh DOM
            function remove(id) {
                var elem = document.getElementById(id);
                return elem.parentNode.removeChild(elem);
            }
            remove(id)
        }
    }
}