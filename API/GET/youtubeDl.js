const express = require('express');
const router = express.Router();
const youtubeDl = require('../../src/helper/youtubeDlCLI');

class Info {
    constructor(url){
        this.url = url;
    }
    async getJSON(){
        const dl = new youtubeDl.youtubeDlCLI(this.url);
        const coverImage = await dl.getCoverArt();
        const title = await dl.getTitle();
        const description = await dl.getDescription();

        return {
            coverImage,
            title,
            description,
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