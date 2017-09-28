const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Tracks = require('../schema/Tracks');

router.get('/', (req, res) => {

    const offset = parseInt(req.query.offset) || 0;

    class TracksClass {
        async findTracksAndResponse(){
            try{
                // Find the the latest 10 tracks order by the upload date
                const tracks = await Tracks.find({
                    $or: [
                        {
                            private: false,
                        },
                        {
                            private: {
                                $exists: false,
                            }
                        }
                    ]
                }, {
                    file: 0,
                    _id: 0,
                    __v: 0,
                    comments: 0,
                    fave: 0,
                }).limit(10).skip(offset).sort({uploadDate: -1});

                const total = await Tracks.count({});
                res.json({
                    tracks,
                    total,
                });

            }
            catch(error){
                console.log(error);
            }
        }
    }

    const tracks = new TracksClass();
    tracks.findTracksAndResponse();

});
module.exports = router;