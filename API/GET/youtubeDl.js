const express = require('express');
const router = express.Router();
const youtubeDl = require('../../src/helper/youtubeDlCLI');

class Info {
    constructor(url){
        this.url = url;
    }
    async getJSON(){
        const dl = new youtubeDl.youtubeDlCLI(this.url);
        const jobs = [];
        jobs.push(dl.getBesetAudio());
        jobs.push(dl.getWorstAudio());
        jobs.push(dl.getCoverArt());
        jobs.push(dl.getDescription());
        jobs.push(dl.getTitle());
        jobs.push(dl.getBestVideo());
        jobs.push(dl.getWorstVideo());
        const info = await Promise.all(jobs);
        return {
            audio: {
                best: info[0].trim(),
                worst: info[1].trim(),
            },
            coverImage: info[2].trim(),
            description: info[3].trim(),
            title: info[4].trim(),
            video: {
                best: info[5].trim(),
                worst: info[6].trim(),
            }
        }
    }
}

router.get('/', (req, res) => {
    const info = new Info(req.query.url);
    info.getJSON()
    .then(json => {
        res.json(json);
    })
    .catch(error => {
        console.log(error);
    });
});

module.exports = router;