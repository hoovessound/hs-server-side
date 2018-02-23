const express = require('express');
const router = express.Router();
const youtubeDl = require('../../src/helper/youtubeDlCLI');

class Info {
    constructor(url, req){
        this.url = url;
        this.req = req;
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
            coverImage: {
                origin: info[2].trim(),
                100: `${this.req.protocol}://${this.req.get('host')}/image/proxy?url=${info[2].trim()}&width=100`,
                250: `${this.req.protocol}://${this.req.get('host')}/image/proxy?url=${info[2].trim()}&width=250`,
                300: `${this.req.protocol}://${this.req.get('host')}/image/proxy?url=${info[2].trim()}&width=300`,
                480: `${this.req.protocol}://${this.req.get('host')}/image/proxy?url=${info[2].trim()}&width=480`,
                500: `${this.req.protocol}://${this.req.get('host')}/image/proxy?url=${info[2].trim()}&width=500`,
            },
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
    const info = new Info(req.query.url, req);
    info.getJSON()
    .then(json => {
        res.json(json);
    })
    .catch(error => {
        res.status(500);
        res.json({
            error: 'Something when wrong while trying to fetch data from YouTube',
        });
        console.log(error);
    });
});

module.exports = router;