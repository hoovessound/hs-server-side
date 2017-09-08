"use strict";function playMusic(e){masterPlayerTimeStamp.value=0,audio.currentTime=0,masterPlayer.classList.remove("remotePlay");var a=e.getAttribute("trackid"),t=e.getAttribute("title"),r=e.getAttribute("fullname"),i=e.getAttribute("username");masterTitle.innerHTML=r+" - "+t,masterTitle.href=$full_address+"/track/"+i+"/"+t,audio.src=$full_address+"/api/listen/"+a,audio.play(),audio.onloadedmetadata=function(){masterPlayerTimeStamp.max=audio.duration},masterPlayPuaseButton.innerHTML="pause",io.emit("audio:toserver:new",{trackID:a,title:t,fullName:r,username:i,token:token,id:io.id,volume:volumeBar.value})}function pauseTheAudio(e){audio.pause(),masterPlayPuaseButton.innerHTML="play_arrow",io.emit("audio:toserver:pause",{token:token,id:io.id})}function playTheAudio(e){audio.play(),audio.onloadedmetadata=function(){masterPlayerTimeStamp.max=audio.duration},masterPlayPuaseButton.innerHTML="pause",io.emit("audio:toserver:play",{token:token,id:io.id})}var masterTitle=document.querySelector(".masterPlayer .title"),masterPlayPuaseButton=document.querySelector(".masterPlayer .playPuaseButton"),masterPlayer=document.querySelector(".masterPlayer"),masterPlayerTimeStamp=document.querySelector(".masterPlayer .timeStamp"),volumeBar=document.querySelector("#volumeBar"),tracksElement=document.querySelector(".tracks"),container=document.querySelector(".container"),ajax=new XMLHttpRequest,ajaxing=!1,initPlay=!0;audio.addEventListener("ended",function(e){masterPlayPuaseButton.innerHTML="play_arrow",setTimeout(function(){localPlayList.nextTrack()},1e3)}),io.on("audio:fromserver:change",function(e){masterTitle.innerHTML=e.fullName+" - "+e.title,masterPlayer.classList.add("remotePlay"),masterTitle.href=$full_address+"/track/"+e.username+"/"+e.title,audio.src=$full_address+"/api/listen/"+e.trackID+"?token="+$token,audio.pause(),masterPlayPuaseButton.innerHTML="pause"}),io.on("audio:fromserver:pause",function(e){masterPlayer.classList.add("remotePlay"),masterPlayPuaseButton.innerHTML="play_arrow"}),io.on("audio:fromserver:play",function(e){masterPlayer.classList.add("remotePlay"),masterPlayPuaseButton.innerHTML="pause"}),io.on("audio:fromserver:volume",function(e){masterPlayer.classList.add("remotePlay"),audio.volume=e.volume/100,volumeBar.value=e.volume}),io.on("audio:fromserver:timeupdate",function(e){masterPlayerTimeStamp.value=e.playtime.currentTime,audio.currentTime=e.playtime.currentTime}),volumeBar.addEventListener("input",function(e){var a=parseInt(e.target.value);audio.volume=a/100,io.emit("audio:toserver:volume",{token:token,id:io.id,volume:a})}),masterPlayPuaseButton.onclick=function(e){audio.paused?playTheAudio():pauseTheAudio()},audio.ontimeupdate=function(){if(!masterPlayer.classList.contains("remotePlay")){var e=audio.currentTime;masterPlayerTimeStamp.value=e,io.emit("audio:toserver:timeupdate",{token:token,id:io.id,playtime:{currentTime:audio.currentTime,duration:audio.duration}})}},masterPlayerTimeStamp.oninput=function(e){audio.currentTime=masterPlayerTimeStamp.value,io.emit("audio:toserver:timeupdate",{token:token,id:io.id,playtime:{currentTime:audio.currentTime,duration:audio.duration}})};