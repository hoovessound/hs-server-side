var input = document.querySelector('#commentSession #input');
var post = document.querySelector('#commentSession #post');
var comments = document.querySelector('#comments');

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
    var ajax = new XMLHttpRequest();
    ajax.open('POST', '/api/comment/add');
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.setRequestHeader('token', token);
    ajax.send(JSON.stringify({
        trackid: trackid,
        comment: text,
    }));
    ajax.onload = function(){
        if(ajax.readyState === 4 && ajax.status === 200){
            var response = JSON.parse(ajax.response);
            input.value = null;
            // Append the cooemt into the top of the comment session
            var container = document.createElement('div');
            container.class = 'comment';
            var link = document.createElement('a');
            link.href = `${full_address}/user/${response.author.username}`;
            link.innerHTML = response.author.fullName;
            var comment = document.createElement('p');
            comment.innerHTML = response.commentObject.comment;
            container.appendChild(link);
            container.appendChild(comment);
            comments.insertBefore(container, comments.firstChild);
        }
    }
}