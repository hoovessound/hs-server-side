const express = require('express');
const router = express.Router();
const Tracks = require('../../schema/Tracks');
const Users = require('../../schema/Users');
const Tags = require('../../schema/Tags');
const trackResponseSchema = require('../../responseSchema/Track');

router.get('/:tag', async function(req, res){
    const tags = await Tags.findOne({
        name: req.params.tag,
    });
    if(tags === null){
        res.json({
            tracks: [],
        });
        return false;
    }else{
        const jobs = [];
        // Fetch all tracks data
        tags.tracks.map(id => {
            jobs.push(
                Tracks.findOne({
                    id,
                }, trackResponseSchema)
            );
        });
        const tracks = await Promise.all(jobs);

        // Find all tracks authorts
        const existsAuthors = [];
        const fetchAuthorJobs = [];
        tracks.map(track => {
            if(track !== null){
                existsAuthors.push(track.author);
                fetchAuthorJobs.push(
                    Users.findOne({
                        id: track.author,
                    }, {
                        username: 1,
                        fullname: 1,
                        id: 1,
                    })
                );
            }
        });

        const authors = await Promise.all(fetchAuthorJobs);
        let hostname = req.hostname;
        if(process.env.NODE_ENV !== 'production'){
            hostname += ':3000';
        }
        tracks.map((track, index) => {
            authors.map(author => {
                if(track.author === author.id){
                    tracks[index].author = author;
                }
            });
            tracks[index].coverImage = `${req.protocol}://api.hoovessound.ml/image/coverart/${track.id}`;
        });
        res.json(tracks);
    }
});

module.exports = router;