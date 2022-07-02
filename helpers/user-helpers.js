var db = require('../config/connections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt') //Password Encryption

module.exports = {
    doSignup:(userData)=> {
        return new Promise(async(resolve,reject)=> {
            userData.Password = await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTIONS).insertOne(userData).then((data)=> {
                resolve(data)
            })
        })
        
    },
    //To check email and password 
    doLogin:(userData) => {
        return new Promise(async(resolve,reject)=> {
            let loginStatus =false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTIONS).findOne({Email:userData.Email})
            if(user) {
                bcrypt.compare(userData.Password, user.Password).then((status)=> {
                    if(status) {
                        console.log("login successfully");
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else{
                        console.log("Login failed");
                        resolve({status:false})
                    }
                })
            }
            else {
                console.log("User does not exists"); 
                resolve({status:false}) 
            }
        })
    } 
}