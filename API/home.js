import express from 'express';
const router = express.Router();
import Users from '../schema/Users';
import Tracks from '../schema/Tracks';

router.get('/', (req, res) => {
    // Check for access token
    const token = req.body.token || req.headers.token || req.query.token;
    const offset = parseInt(req.query.offset) || 0;

    class TracksClass {
        async authUser(){
            try{
                const user = await Users.findOne({token});
                if(user === null) {
                    res.json({
                        error: true,
                        msg: 'Can not find your token',
                        code: 'token_not_found',
                    });
                    return false;
                }else{
                    this.findTracksAndResponse();
                }
            }
            catch(error){
                console.log(error);
            }
        }
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
    tracks.authUser();

});
module.exports = router;