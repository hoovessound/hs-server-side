import express from 'express';
const router = express.Router();
import rp from 'request-promise';
import fullurl from 'fullurl';
import Users from '../../../schema/Users';
import Tracks from '../../../schema/Tracks';

router.get('/:query?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const token = req.cookies['oauth-token'];
        const query = req.params.query ? req.params.query.trim() : null;
        Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }else{
                if(query === null){
                    res.redirect('/');
                    return false;
                }

                if(query.length <= 0){
                    res.redirect('/');
                    return false;
                }

                function escapeRegex(text) {
                    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                };
                const regex = new RegExp(escapeRegex(query), 'ig');

                return Promise.all([
                    Users.find({
                        $or: [
                            {
                                username: regex,
                            },
                            {
                                fullName: regex,
                            }
                        ]
                    }, {
                        password: 0,
                        tracks: 0,
                        token: 0,
                    }),
                    Tracks.find({
                        title: regex,
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
                    })
                ])
                .then(response => {
                    res.render('search', {
                        loginUser: user,
                        users: response[0],
                        tracks: response[1],
                        full_address,
                        token,
                    });
                })

            }
        }).catch(error => {
            console.log(error);
        });
    }
});

module.exports = router;