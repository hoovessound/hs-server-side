const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fullurl = require('fullurl');
const Users = require('../../../schema/Users');
const Tracks = require('../../../schema/Tracks');
const formidable = require('formidable');
const path = require('path');
const gcs = require('@google-cloud/storage')({
    projectId: 'hoovessound',
    keyFilename: require('../../index').gcsPath,
});
const sha256 = require('sha256');
const randomstring = require('randomstring');
const fsp = require('fs-promise');
const easyimage = require('easyimage');
const escape = require('escape-html');

const TextFormattign = {
    url: (text) => {
        const regex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/igm;
        if(typeof text !== 'undefined' && text !== null){
            if(text.match(regex)){
                const url = text.match(regex);
                return text.replace(url, `<a href="${url}" target="_blank">${url}</a>`);
            }else{
                return text;
            }
        }
    }
}

router.get('/:id?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{
        const id = req.params.id;
        const token = req.cookies['oauth-token'];
        let _user;
        let comments = [];
        Users.findOne({
            token,
        })
        .then(user => {
            if(user === null){
                res.end('Access denied');
            }else{
                _user = user;
            }

            return Tracks.findOne({
                id,
            })
        })
        .then(track => {
            this.track = track;
            if(track === null){
                res.render('track', {
                    loginUser: _user,
                    track: null,
                    comments: null,
                    full_address,
                    token,
                    isFave: 'notFave',
                    error: `Can't not find your track :/`
                });
                return false;
            }
            // Find out if the user fave this track or not

            if(track.description){
                track.description = TextFormattign.url(track.description);
            }

            if(track.comments.length >= 1){
                track.comments.forEach((comment, index) =>{

                    // Find the user object
                    return Users.findOne({
                        id: comment.author,
                    })
                    .then(user => {
                        if(!user){
                            // Remove the comment
                            track.comments[index] = null;
                        }else{
                            // text formatting
                            this.track.comments[index].comment = TextFormattign.url(this.track.comments[index].comment);
                            this.track.comments[index].author = {
                                username: user.username,
                                fullName: user.fullName,
                            };
                        }
                        if(track.comments.length === (index + 1) ){
                            // Find the track author
                            renderPage();
                        }
                    })
                    .catch(error => {
                        console.log(error);
                    })

                });
            }else{
                renderPage();
            }

            function renderPage() {

                // Find the track author
                return Users.findOne({
                    id: track.author,
                })
                .then(trackAuthor => {

                    let isFave = 'isFave'
                    if(_user.fave.includes(track.id)){
                        isFave = 'isFave';
                    }else{
                        isFave = 'notFave';
                    }

                    if(trackAuthor){
                        track.author = {
                            username: trackAuthor.username,
                            fullName: trackAuthor.fullName,
                        };

                        res.render('track', {
                            loginUser: _user,
                            track,
                            comments: track.comments,
                            full_address,
                            token,
                            isFave,
                        });

                    }else{
                        res.render('track', {
                            loginUser: _user,
                            track: null,
                            comments: null,
                            full_address,
                            token,
                            isFave: 'notFave',
                            error: `Can't not find your track :/`
                        });
                        return false;
                    }
                })
                .catch(error => {
                    console.log(error);
                })
            }

        })
        .catch(error => {
            console.log(error);
        })
    }
});

router.get('/:id?/edit', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.end('Access denied');
    }else{
        const id = req.params.id;
        const token = req.cookies['oauth-token'];
        let _user;
        Users.findOne({
            token,
        })
        .then(user => {
            _user = user;
            if(user === null){
                res.end('Access denied');
            }

            return Tracks.findOne({
                id,
            })
        })
        .then(track => {
            if(!track){
                res.render('editTrack', {
                    loginUser: user,
                    token,
                    full_address,
                    error: 'Can not found your track :/'
                });
                return false;
            }

            if(track.author !== _user.id){
                res.send('<h1>You don\'t have access to that</h1>');
                return false;
            }else{
                res.render('editTrack', {
                    loginUser: _user,
                    full_address,
                    token,
                    track,
                    error: false,
                });
            }
        })
        .catch(error => {
            console.log(error);
        })
    }
});

module.exports = router;