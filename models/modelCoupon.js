const {getDb} = require('../config/dbConnection');
const {ObjectId} = require('mongodb');


class Coupon{
    constructor(name,offer,minPurchase,couponType,couponCode,expirationDate,status){
        this.name = name;
        this.offer=offer;
        this.minPurchase=minPurchase;
        this.couponType=couponType;
        this.couponCode=couponCode;
        this.expirationDate=expirationDate;
        this.status=status;
        console.log(name);

    }
    

    async save(){
        try{
            const db = getDb();
            const result = await db.collection('coupon').insertOne(this);
            return result.insertedId
        } catch (error){
            console.log(error.message);
        }
    }

    static async getCouponByID(id){
        try {
          const db = getDb();
          return await db.collection('coupon').findOne({_id:new ObjectId(id)});
          
        } catch (error) {
            console.log(error.message);
        }
      }

      static async updateCoupon(id,updateCoupon){
        try {

            console.log('update function id',id)
            console.log('update coupon',updateCoupon);
            const db = getDb();
            await db.collection('coupon').updateOne(
                { _id: new ObjectId(id) },
                {
                $set:{

                    name:updateCoupon.name,
                    offer:updateCoupon.offer,
                    minPurchase:updateCoupon.minPurchase,
                    couponType:updateCoupon.couponType,
                    expirationDate:updateCoupon.expirationDate,
                    couponCode:updateCoupon.couponCode,
                    status:updateCoupon.status
                }
            }
            );
        } catch (error) {
            console.log(error.message);
            
        }
      }

}

module.exports= Coupon;