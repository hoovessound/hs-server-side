'use strict';

var tagInput = document.querySelector('#tagInput');
var tagDisplay = document.querySelector('#tags .display');

tagInput.addEventListener('keypress', function (e) {
    var keyCode = e.keyCode;
    // Enter
    if (keyCode === 13) {
        e.preventDefault();
        // Add a new tag
        var value = e.target.value;
        var trackId = e.target.getAttribute('trackid');
        value = value.replace(/ /g, '_');
        value = value.replace(/[^a-zA-Z0-9_]/g, '');
        var ajax = new XMLHttpRequest();
        ajax.open('POST', full_address_util.addSubdomain('api', '/track/tag/' + trackId + '?bypass=true&oauth_token=' + token));
        ajax.setRequestHeader('Content-Type', 'application/json');
        ajax.send(JSON.stringify({
            tag: value
        }));
        tagDisplay.innerHTML += '<div onclick="removeTag(this)" trackid="' + trackId + '" tagname="' + value + '"># ' + value + '</div>';
        tagInput.value = "";
    }
});

function removeTag(e) {
    var tagName = e.getAttribute('tagname');
    var trackId = e.getAttribute('trackid');
    e.style.display = "none";
    var ajax = new XMLHttpRequest();
    ajax.open('DELETE', full_address_util.addSubdomain('api', '/track/tag/' + trackId + '?bypass=true&oauth_token=' + token));
    ajax.setRequestHeader('Content-Type', 'application/json');
    ajax.send(JSON.stringify({
        tag: tagName
    }));
}