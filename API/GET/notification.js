const express = require('express');
const router = express.Router();
const Users = require('../../schema/Users');
const Notifications = require('../../schema/Notifications');

class Notification {
    constructor(req, res){
        this.res = res;
        this.req = req;
    }

    async get(){
        const req = this.req;
        const res = this.res;
        const user = req.hsAuth.user;
        const notifications = await Notifications
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
        .limit(5);

        // Fetch the author
        const jobs = [];

        async function fetchAuthor(id) {
            try{
                const user = await Users.findOne({
                    id,
                });
                return({
                    username: user.username,
                    fullname: user.fullName,
                    id: user.id,
                });
            }
            catch(error){
                console.log(error);
            }
        }

        notifications.map(payload => {
            jobs.push(fetchAuthor(payload.author));
        })
        
        const authors = await Promise.all(jobs);

        authors.map((author, index) => {
            notifications[index].author = author;
        });
        res.json(notifications);
    }

}

router.get('/', (req, res) => {
    const notification = new Notification(req, res);
    notification.get();
})

module.exports = router;