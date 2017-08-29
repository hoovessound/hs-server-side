const policy = [
  {
    query: new RegExp(/[A-Z]/g),
    msg: 'Atleast 1 uppercase',
  },
  {
    query: new RegExp(/[a-z]/g),
    msg: 'Atless 1 lowercase letter'
  },
  {
    query: new RegExp(/.{8,}/g),
    msg: '8 characters or more'
  }
]

const passwords = [
  'RainbowDashieIsTheBestPony1Guess',
  '1234',
  'password2017',
  'MyLittlePonyFriendshipIsFuckUp'
]

passwords.map(pwd => {
  // Get the password
  // And test it with all password policys
  for(key in policy){
    const job = policy[key];
    const msg = job.msg;
    const query = job.query;
    if(pwd.match(query)){
      console.log('\x1b[32m%s\x1b[0m', 'SUCCESS', msg)
    }else{
      console.log('\x1b[31m%s\x1b[0m', 'FAILL', `${msg} : ${pwd}`)
    }
  }
})