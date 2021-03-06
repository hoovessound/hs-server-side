const message = document.querySelector('#messages');
const passwordElement = document.querySelector('.password');
const policy = [
    {
        query: new RegExp(/[A-Z]/g),
        msg: 'At less one uppercase latter',
    },
    {
        query: new RegExp(/[a-z]/g),
        msg: 'At less one lowercase latter',
    },
    {
        query: new RegExp(/.{8,}/g),
        msg: 'At less have 8 characters',
    }
]

passwordElement.oninput = function () {
    const pwd = passwordElement.value;
    for(let key in policy){
        if(!pwd.match(policy[key].query)){
            message.innerHTML = policy[key].msg;
        }else{
            message.innerHTML = '';
        }
    }
}