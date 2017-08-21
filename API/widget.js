import express from 'express';
const router = express.Router();
import Tracks from '../schema/Tracks';

router.get('/:id?', (req, res) => {
    const full_address = req.protocol + "://" + req.headers.host;
    const id = req.params.id;
    Tracks.findById(id).then(track => {
        res.header('X-FRAME-OPTIONS', 'ALLOW-FROM ' + req.query.domain);
        res.render('widget', {
            track,
            full_address,
        });
    }).catch(error => {
        if(error.message.includes('Cast to ObjectId failed for value')){
            res.render('widget', {
                track: null,
                full_address,
            });
        }else{
            console.log(error)
        }
    })
});

module.exports = router;