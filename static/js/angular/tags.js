const tagInput = document.querySelector('#tagInput');
const tagDisplay = document.querySelector('#tags .display');

tagInput.addEventListener('keypress', e => {
    const keyCode = e.keyCode;
    // Enter
    if(keyCode === 13){
        e.preventDefault();
        // Add a new tag
        let value = e.target.value;
        const trackId = e.target.getAttribute('trackid');
        value = value.replace(/ /g, '_');
        value = value.replace(/[^a-zA-Z0-9_]/g, '');
        const ajax = new XMLHttpRequest();
        ajax.open('POST', full_address_util.addSubdomain('api', `/track/tag/${trackId}?bypass=true&oauth_token=${token}`));
        ajax.setRequestHeader('Content-Type', 'application/json');
        ajax.send(JSON.stringify({
            tag: value,
        }));
        tagDisplay.innerHTML += `<div onclick="removeTag(this)" trackid="${trackId}" tagname="${value}"># ${value}</div>`
        tagInput.value = "";
    }
});

function removeTag(e){
    const tagName = e.getAttribute('tagname')
    const trackId = e.getAttribute('trackid');
    e.style.display = "none"
    const ajax = new XMLHttpRequest();
    ajax.open('DELETE', full_address_util.addSubdomain('api', `/track/tag/${trackId}?bypass=true&oauth_token=${token}`));
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.send(JSON.stringify({
        tag: tagName,
    }));
}