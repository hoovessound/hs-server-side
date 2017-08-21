import express from 'express';
const router = express.Router();
import rp from 'request-promise';
import fullurl from 'fullurl';
import Users from '../../../schema/Users';

router.get('/', (req, res) => {
    if(!req.cookies['oauth-token']){
        res.redirect('/api/auth/login?redirect=' + fullurl(req));
    }else{
        const token = req.cookies['oauth-token'];
        const full_address = req.protocol + "://" + req.headers.host;

        Users.findOne({
            token,
        }).then(user => {
            if(user === null){
                res.redirect('/api/auth/login?redirect=' + fullurl(req));
            }else{
                res.render('upload', {
                    loginUser: user,
                    error: null,
                    token,
                });
            }
        }).catch(error => {
            console.log(error)
        });
    }
});

module.exports = router;