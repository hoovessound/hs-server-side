const express = require('express');
const router = express.Router();
const Doodles = require('../../schema/Doodles');
const Users = require('../../schema/Users');

async function fetchArtWork(req) {
    try{
        const count = await Doodles.count();
        const random = Math.floor(Math.random() * count);
        const artWork = await Doodles.findOne().skip(random);
        const user = await Users.findOne({id: artWork.author});
        return ({
            id: artWork.id,
            image: `${req.protocol}://api.hoovessound.ml/image/doodle/${artWork.id}`,
            used: artWork.used,
            author: {
                id: user.id,
                fullname: user.fullName,
                username: user.username,
            },
            link: artWork.link,
        });
    }
    catch (e){
        console.log(e)
    }
}

async function fetchArtWorks(skip, isRandom, req) {
    try{
        const limit = 5;
        const count = await Doodles.count();
        const random = Math.floor(Math.random() * count);
        let skipNumber = parseInt(isRandom ? random : skip);
        const offlimit = parseInt(skipNumber + limit);
        const existsAuthors = [];
        const jobs = [];
        if(offlimit > count){
            skipNumber = count - limit;
        }

        async function fetchUser(id) {
            const user = await Users.findOne({
                id,
            });
            return({
                username: user.username,
                fullname: user.fullName,
                id: user.id,
            });
        }

        const artWork = await Doodles.find({}, {
            id: 1,
            image: 1,
            used: 1,
            author: 1,
            link: 1,
            _id: 0,

        }).skip(skipNumber).limit(limit);

        artWork.map(doodle => {
            if(!existsAuthors.includes(doodle.author)){
                jobs.push(fetchUser(doodle.author));
                existsAuthors.push(doodle.author);
            }
        });

        const authors = await Promise.all(jobs);
        artWork.map((doodle, index) => {
            authors.map(author => {
                if(doodle.author === author.id){
                    artWork[index].author = author;
                }
            });
            artWork[index].image = `${req.protocol}://api.hoovessound.ml/image/doodle/${doodle.id}`;
        });
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
        const artWork = await fetchArtWork(req)
        res.json(artWork);
    }
    
    async findDoodles(skip){
        const res = this.res;
        const req = this.req;
        const artWork = await fetchArtWorks(skip, req.query.random, req)
        res.json(artWork);
    }
}

router.get('/', (req, res) => {
    const doodle = new Doodle(req, res);
    doodle.findDoodle(req);
});

router.get('/collections/:skip?', (req, res) => {
    const skip = req.params.skip || 0;
    const doodle = new Doodle(req, res);
    doodle.findDoodles(skip);
});

module.exports = router;