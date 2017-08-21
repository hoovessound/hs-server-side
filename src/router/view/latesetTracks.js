import express from 'express';
const router = express.Router();
import rp from 'request-promise';
import fullurl from 'fullurl';
import Users from '../../../schema/Users';
import Tracks from '../../../schema/Tracks';

router.get('/', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const offset = req.query.offset || 0;
    const token = req.cookies['oauth-token'];
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{

        Users.findOne({
            token: token,
        }).then(user => {
            if(user === null){
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
                return false;
            }else{
                return Tracks.find({
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
                }).limit(10).skip(parseInt(offset)).sort({
                    uploadDate: -1
                }).then(tracks => {
                    res.render('tracks', {
                        tracks,
                        full_address,
                        token,
                        offset,
                        track: tracks[0],
                    });
                })
            }
        }).catch(error => {
            console.log(error)
        })
    }
});

module.exports = router;