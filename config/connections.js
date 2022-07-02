const mongoClient = require('mongodb').MongoClient
//DB object
const state = {
    db:null
}

//Any files we can accept
module.exports.connect = function(done) {
    const url = 'mongodb://localhost:27017'
    const dbname = 'shopping'
    //Connection create
    mongoClient.connect(url,function(err, data){
        if(err) return done(err)
        state.db = data.db(dbname)
        done()
    })
    
}

//If we wants to get data
module.exports.get = function() {
    return state.db
}