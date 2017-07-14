const input = document.querySelector('#commentSession #input');
const post = document.querySelector('#commentSession #post');
const comments = document.querySelector('#comments');

post.addEventListener('click', e => {
    postComment(input.value);
});

input.addEventListener('keydown', e => {
    if(e.keyCode === 13){
        e.preventDefault();
        postComment(input.value);
    }
});

function postComment(text) {
    const ajax = new XMLHttpRequest();
    // Get the oauth-token from the cookie
    ajax.open('POST', '/api/comment/add');
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.send(JSON.stringify({
        token: oauthToken,
        trackid: trackid,
        comment: text,
    }));
    ajax.onload = function(){
        if(ajax.readyState === 4 && ajax.status === 200){
            const response = JSON.parse(ajax.response);
            input.value = null;
            // Append the cooemt into the top of the comment session
            const container = document.createElement('div');
            container.class = 'comment';
            const link = document.createElement('a');
            link.href = `${full_address}/user/${response.author.username}`;
            link.innerHTML = response.author.fullName;
            const comment = document.createElement('p');
            comment.innerHTML = response.comment;
            container.appendChild(link);
            container.appendChild(comment);
            comments.insertBefore(container, comments.firstChild);
        }
    }
}