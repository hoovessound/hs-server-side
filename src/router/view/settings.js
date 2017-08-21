import express from 'express';
const router = express.Router();
import rp from 'request-promise';
import fullurl from 'fullurl';
import Users from '../../../schema/Users';

router.get('/', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const token = req.cookies['oauth-token'];

        return Users.findOne({
            token: token,
        }).then(user => {
            if (user === null) {
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }else{
                res.render('settings', {
                    loginUser: user,
                    error: null,
                    token,
                });
            }
        });
    }
});

module.exports = router;