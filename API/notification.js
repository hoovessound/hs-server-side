const express = require('express');
const router = express.Router();
const Users = require('../schema/Users');
const Notifications = require('../schema/Notifications');
const genId = require('../src/helper/genId');
const htmlEscape = require('escape-html');

class Notification {
    constructor(req, res){
        this.res = res;
        this.req = req;
    }

    async get(){
        const req = this.req;
        const res = this.res;
        const user = req.hsAuth.user;
        const response = await Notifications
        .find({
            receiver: user.id,
        }, {
            id: 1,
            icon: 1,
            title: 1,
            message: 1,
            data: 1,
            link: 1,
            author: 1,
            receiver: 1,
            read: 1,
            _id: 0,
        })
        .limit(5)
        res.json(response)
    }

    async send(){
        const req = this.req;
        const res = this.res;
        const senderId = req.hsAuth.user.id;

        if(!req.body.to){
            res.json({
                error: 'Missing the "to" field',
                code: 'unexpected_result',
            });
            return false;
        }

        if(!req.body.message){
            res.json({
                error: 'Missing the "message" field',
                code: 'unexpected_result',
            });
            return false;
        }
        const receiver = await Users.findOne({id: req.body.to});
        if(!receiver){
            res.json({
                error: 'Can not find the receiver ID',
                code: 'unexpected_result',
            });
            return false;
        }
        const data = {
            id: genId(50),
            title: htmlEscape(req.body.title),
            link: req.body.link,
            message: htmlEscape(req.body.message),
            icon: req.body.icon,
            date: new Date(),
            author: senderId,
            receiver: req.body.to,
            read: false,
        }
        res.json(data);
        new Notifications(data).save();
    }

    async delete(){
        const req = this.req;
        const res = this.res;

        const id = req.body.id;
        const user = req.hsAuth.user;

        const payload = await Notifications.findOne({id});

        if(payload.author === user.id){
            // Is the owner
            await Notifications.remove({
                _id: payload._id
            });
            res.json({
                success: true,
            })
        }else{
            res.json({
                error: `This payload is not belong to you`,
                code: 'bad_authentication',
            });
            return false;
        }

    }
}

router.get('/', (req, res) => {
    const notification = new Notification(req, res);
    notification.get();
})

router.post('/', (req, res) => {
    const notification = new Notification(req, res);
    notification.send();
})

router.delete('/', (req, res) => {
    const notification = new Notification(req, res);
    notification.delete();
})

module.exports = router;