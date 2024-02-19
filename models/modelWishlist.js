const {getDb} = require('../config/dbConnection');
const {objectId} = require('mongodb');

class Wishlist{
    constructor(userID,product){
        this.userID = userID;
        this.product = product;
        console.log('wh UID',userID);
        console.log('wh pID',product);
    }

    async save(){
        try {
            console.log('enterd saving function');
           const db = getDb();
           const result = await db.collection('wishlist').insertOne(this);
           return result.insertedId
        } catch (error) {
            console.log(error.message);
        }
    }
}

module.exports = Wishlist;