const express = require('express');
const router = express.Router();
const Doodles = require('../schema/Doodles');
const genId = require('../src/helper/genId');
const htmlEscape = require('escape-html');

async function fetchArtWork() {
    try{
        const count = await Doodles.count();
        const random = Math.floor(Math.random() * count);
        const artWork = await Doodles.findOne().skip(random);
        return ({
            id: artWork.id,
            image: artWork.image,
            used: artWork.used,
            author: artWork.author,
        });
    }
    catch (e){
        console.log(e)
    }
}

async function fetchArtWorks(skip, isRandom) {
    try{
        const limit = 5;
        const count = await Doodles.count();
        const random = Math.floor(Math.random() * count);
        let skipNumber = parseInt(isRandom ? random : skip);
        const offlimit = parseInt(skipNumber + limit);
        if(offlimit > count){
            skipNumber = count - limit;
        }
        const artWork = await Doodles.find({}, {
            id: 1,
            image: 1,
            used: 1,
            author: 1,
            _id: 0,

        }).skip(skipNumber).limit(limit);
        return(artWork)
    }
    catch (e){
        console.log(e)
    }
}

class Doodle {
    constructor(req, res){
        this.res = res;
        this.req = req;
    }

    async findDoodle(){
        const res = this.res;
        const req = this.req;
        const artWork = await fetchArtWork()
        res.json(artWork);
    }
    
    async findDoodles(skip){
        const res = this.res;
        const req = this.req;
        const artWork = await fetchArtWorks(skip, req.query.random)
        res.json(artWork);
    }

    async postDoodle(){
        const res = this.res;
        const req = this.req;
        const user = req.hsAuth.user;
        const title = req.body.title ? htmlEscape(req.body.title) : '_NA_';
        const link = req.body.link ? req.body.link : `https://hoovessound.ml/@${user.username}`;
        if(!req.body.imgur){
            res.json({
                error: 'Missing the "imgur" field',
                code: 'unexpected_result',
            });
            return false;
        }

        if(!req.body.imgur.startsWith('https://i.imgur.com')){
            res.json({
                error: 'Not valid imgur url',
                code: 'unexpected_result',
            });
            return false;
        }
        const data = {
            id: genId(50),
            title,
            author: {
                link,
                source: 'imgur',
                name: user.username,
                id: user.id
            },
            image: req.body.imgur,
            pending: true,
        }
        await new Doodles(data).save();
        res.json(data);

    }

}

router.get('/', (req, res) => {
    const doodle = new Doodle(req, res);
    doodle.findDoodle();
});

router.get('/collections/:skip?', (req, res) => {
    const skip = req.params.skip || 0;
    const doodle = new Doodle(req, res);
    doodle.findDoodles(skip);
});

router.post('/', (req, res) => {
    const doodle = new Doodle(req, res);
    doodle.postDoodle();
})

module.exports = router;