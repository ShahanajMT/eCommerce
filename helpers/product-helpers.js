var db = require('../config/connections')
var collection = require('../config/collections');
const { response } = require('../app');
const { ObjectId } = require('mongodb');
var objectId = require('mongodb').ObjectId
module.exports = {
    addProduct: (product, callBack) =>{
        console.log(product);

        
    

        db.get().collection('products').insertOne(product).then((data)=>{
            console.log(data);
            callBack(data.insertedId)
            //console.log(ops); 
        })
    },
    getAllProducts: () => {
        return new Promise(async(resolve, reject)=> {
            let products =await db.get().collection(collection.PRODUCT_COLLETIONS).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId) => {
        return new Promise((resolve, reject) =>{
            db.get().collection(collection.PRODUCT_COLLETIONS).deleteOne({_id:objectId(prodId)}).then((response)=> {
                //console.log(response);
                resolve(response) 
            })

        })
    },
    getProductDetails:(prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLETIONS).findOne({_id:objectId(prodId)}).then((product) => {
                resolve(product)
            })
        })
    },
    editProduct:(prodId,ProDetails)=>{
        return new Promise((resolve,reject)=>{
        console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        console.log(ProDetails);
            db.get().collection(collection.PRODUCT_COLLETIONS)
            .updateOne({_id:ObjectId(prodId)}, {
                $set:{
                    Name:ProDetails.Name,
                    Category:ProDetails.Category,
                    Price:ProDetails.Price,
                    Description:ProDetails.Description,
                }
            }).then((response)=>{
                //console.log(response);
                resolve(response)
            })
        })
    },
} 