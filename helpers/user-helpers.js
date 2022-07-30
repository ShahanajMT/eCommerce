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
        let prodObj = {
            item:objectId(prodId),
            quantity:1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTIONS).findOne({user:objectId(userId)})
            if(userCart) {
                let prodExist = userCart.products.findIndex(product => product.item == prodId)
                console.log(prodExist); 
                if(prodExist!= -1) {
                    db.get().collection(collection.CART_COLLECTIONS)
                    .updateOne({user:objectId(userId),'products.item':objectId(prodId)},
                    {
                        $inc:{'products.$.quantity':1} 
                    }
                    ).then(() => {
                        resolve()
                    })
                }
                else {
                 db.get().collection(collection.CART_COLLECTIONS)
                 .updateOne({user:objectId(userId)},
                 {
                    
                         $push:{products:prodObj}
                    
                 }
                 ).then((response) => {
                     resolve()
                 }) 
                }

            }else {
                let cartObj = {
                    user:objectId(userId),
                    products:[prodObj]
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
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLETIONS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }    
            ]).toArray()   
            //console.log(cartItems[0].products );
            resolve(cartItems) 
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
    },
    changeProductQuantity:(details) => {
        // console.log(cartId, prodId);
        count = parseInt(details.count)
        quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if(count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTIONS)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }  
            ).then((response) => {
                resolve({removeProduct:true})
            })     
            } else {
            db.get().collection(collection.CART_COLLECTIONS)
            .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
            {
                $inc:{'products.$.quantity':count} 
            }
            ).then((response) => {
                resolve({status:true})
            }) 
         } 
        })
    },
    getTotalAmount:(userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTIONS).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLETIONS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }, 
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{'$toLong':'$quantity'}, {'$toLong':'$product.Price'}]}}

                       // [{$addFields: {"Array.field13": {$multiply:["$Array.0.field3","$field0"]}}}]
                    }
                }    
            ]).toArray()   
            console.log(total);
            resolve(total[0].total) 
        })
        


    
    },
    placeOrder:(order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode,
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                date: new Date(),
                status:status,

            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTIONS).deleteOne({user:objectId(order.userId)})
                // console.log(userId);
                resolve()
            })
        })
    },
    getCartProductList:(userId) => {
        return new Promise( async(resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTIONS).findOne({user:objectId(userId)})
            console.log(cart);
            resolve(cart.products)
        })
    }, 
    getUserOrders:(userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let orders = await db.get().collection(collection.CART_COLLECTIONS)
            .findOne({user:objectId(userId)}).toArray()
            resolve(orders)
        })
    },

    getOrderProducts:(orderId) => {
        return new Promise( async(resolve,reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLETIONS,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1, quantity:1, product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            console.log(orderItems);
            resolve(orderItems)
        })
    }

}  