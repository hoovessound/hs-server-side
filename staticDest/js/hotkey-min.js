"use strict";window.addEventListener("keypress",function(e){var a=document.activeElement;"TEXTAREA"!==a.tagName&&"INPUT"!==a.tagName&&"volumeBar"!==a.id&&(e.preventDefault(),32===e.keyCode&&(audio.paused?playTheAudio():pauseTheAudio()))});