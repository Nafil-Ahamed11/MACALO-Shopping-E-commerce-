const {getDb} = require('../config/dbConnection');
const { ObjectId } = require('mongodb');

class Cart{
    constructor(userID,product){
        this.userID = userID;
        this.product = product
        
    }
    async save(){
        try {
            const db = getDb();
            const result =   await db.collection('cart').insertOne(this);
            return result.insertedId
        } catch (error) {
            console.log(error.message);
        }
    }
}

module.exports = Cart;