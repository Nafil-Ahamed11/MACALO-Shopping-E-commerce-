const {getDb} = require('../config/dbConnection');
const { ObjectId } = require('mongodb');
const { orderDetails } = require('../controller/userController');

class Orders {
    constructor(userCollection, cartDetails, orderData, orderDate, deliveryDate, status) {
      this.userCollection = userCollection;
      this.cartDetails = cartDetails;
      this.orderData = orderData;
      this.orderDate = orderDate;
      this.deliveryDate = deliveryDate;
      this.status = status;

      
    }
  
    async save() {
      try {
        const db = getDb();

        const addressID = this.orderData.selectedAddress;
        console.log('addresID',addressID)

        const selectedAddress = this.userCollection.addresses.find(address => address._id.toString() === addressID);
  
        console.log('selectedAdress',selectedAddress);
        if (!selectedAddress) {
          console.log('Selected address not found.');
          return; 
        }

        const orderDetails = {
          userID: this.userCollection._id,
          orderList: this.cartDetails.map(cart => cart.cart.product),
          deliveryAddress: selectedAddress,
          orderDate: this.orderDate,
          deliveryDate: this.deliveryDate,
          orderStatus: this.status,
          totalItems: this.orderData.totalItems,
          subTotal: this.orderData.subTotal,
          discount: this.orderData.discount,
          total: this.orderData.total,
          couponCode: this.orderData.couponCode || null,
          paymentMethode:this.orderData.paymentMethod

        
        };

       
  
        const result = await db.collection('orders').insertOne(orderDetails);
        return result.insertedId;
      } catch (error) {
        console.log(error.message);
      }
    }
  }
  
  module.exports = Orders;
  