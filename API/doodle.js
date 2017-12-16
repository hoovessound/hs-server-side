const express = require('express');
const router = express.Router();
const Doodles = require('../schema/Doodles');

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

class Doodle {
    constructor(req, res){
        this.res = res;
        this.req = req;
    }

    async findDoodles(){
        const res = this.res;
        const req = this.req;
        const artWork = await fetchArtWork()
        res.json(artWork);
    }

}

router.get('/', (req, res) => {
    const doodle = new Doodle(req, res);
    doodle.findDoodles();
});

module.exports = router;