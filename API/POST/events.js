const express = require('express');
const router = express.Router();
const Users = require('../../schema/Users');
const Tracks = require('../../schema/Tracks');

router.post('/', (req, res) => {
    const eventType = req.body.event;
    const payload = req.body.payload;
    const user = req.hsAuth.user;
    switch(eventType){
        default: {
            res.status(403);
            res.json({
                error: 'invalid event type name',
            });
            return false;
        }

        case 'UPDATE_LAST_PLAY': {

            Tracks.findOne({
                id: payload.trackID,
            })
            .then(track => {
                if(!track){
                    res.status(403);
                    res.json({
                        error: 'invalid track ID',
                    });
                    return false;
                }else{
                    
                    user.lastPlay = {
                        date: new Date(),
                        trackID: payload.trackID,
                        volume: payload.volume,
                        isPlaying: payload.isPlaying,
                        playtime: {
                            currentTime: payload.playtime.currentTime,
                            duration: payload.playtime.duration,
                        }
                    }
                    res.json({
                        success: true,
                    });
                    return Users.update({
                        _id: user._id,
                    }, user)
                }
            })
            .catch(error => {
                console.log(error);
            });

            break;
        }

    }

});

module.exports = router;