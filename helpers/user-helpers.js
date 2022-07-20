var db = require('../config/connections')
var collection = require('../config/collections')
const bcrypt = require('bcrypt') //Password Encryption
const { response } = require('../app')
var objectId = require('mongodb').ObjectId


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
    },
    addToCart:(prodId, userId) => {
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTIONS).findOne({user:objectId(userId)})
            if(userCart) {
                db.get().collection(collection.CART_COLLECTIONS)
                .updateOne({user:objectId(userId)},
                {
                    
                        $push:{products:objectId(prodId)}
                    
                }
                ).then((response) => {
                    resolve()
                })

            }else {
                let cartObj = {
                    user:objectId(userId),
                    products:[objectId(prodId)]
                }
                db.get().collection(collection.CART_COLLECTIONS).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTIONS).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLETIONS,
                        let:{proList: '$products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:["$_id", "$$proList"]
                                    }
                                }
                            }
                        ],
                        as:'cartItems'
                    }
                }
            ]).toArray()   
            resolve(cartItems[0].cartItems) 
        })
    },
    getCartCount:(userId) => {
        return new Promise(async(resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTIONS).findOne({user:objectId(userId)})
            if(cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    }
}