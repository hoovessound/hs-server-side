const Users = require('../../schema/Users');
const Notifications = require('../../schema/Notifications');
const genId = require('../../src/helper/genId');
const htmlEscape = require('escape-html');

class Notification {
    constructor(user){
        this.user = user;
    }

    async send(payload){
        const user = this.user;
        if(!payload.to){
            return Promise.reject({
                error: 'Missing the "to" field',
                code: 'missing_require_fields',
            });
        }

        if(!payload.message){
            return Promise.reject({
                error: 'Missing the "message" field',
                code: 'missing_require_fields',
            });
        }
        const receiver = await Users.findOne({id: payload.to});
        if(!receiver){
            return Promise.reject({
                error: 'Can not find the receiver ID',
                code: 'unexpected_result',
            });
        }
        const data = {
            id: genId(50),
            title: htmlEscape(payload.title),
            link: payload.link,
            message: htmlEscape(payload.message),
            icon: payload.icon,
            date: new Date(),
            author: {
                username: user.username,
                fullname: user.fullName,
                id: user.id,
            },
            receiver: payload.to,
            read: false,
        }
        await new Notifications(data).save();
        receiver.unreadNotification = true;
        // Update the user object
        // Notify the user that he/she have a new unread message
        await Users.update({id: payload.to}, receiver);
        return Promise.resolve(data);
    }

    async delete(id){
        const user = this.user;
        const payload = await Notifications.findOne({id});

        if(payload.author === user.id){
            // Is the owner
            await Notifications.remove({
                _id: payload._id
            });
            return Promise.resolve({
                success: true,
            });
        }else{
            return Promise.reject({
                error: `This payload is not belong to you`,
                code: 'bad_authentication',
            });
        }
    }

    async get(read){
        const user = this.user;
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
            jobs.push(fetchAuthor(payload.receiver));
        })
        
        const authors = await Promise.all(jobs);
        
        authors.map((author, index) => {
            notifications[index].author = author;
        });
        if(read === 'true'){
            user.unreadNotification = false;
            Users.update({_id: user._id}, user);
        }
        return Promise.resolve(notifications);
    }
}

module.exports = Notification;