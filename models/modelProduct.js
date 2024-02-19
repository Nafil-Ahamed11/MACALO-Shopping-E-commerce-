const {getDb} = require('../config/dbConnection');
const { ObjectId } = require('mongodb');

class Product{
    constructor(name,category,subCategory,brand,price,discription,image,stock,size){
        this.name = name;
        this.category=category;
        this.subCategory=subCategory;
        this.brand=brand;
        this.price=price;
        this.discription=discription;
        this.image=image;
        this.stock=stock;
        this.size=size;
        // this.footSize=footSize
    }

    async save(){
        try {
            const db = getDb();
            const result =   await db.collection('products').insertOne(this);
            return result.insertedId;
        } catch (error) {
            console.log(error.message);
        }
    }

    static async getAllproducts() {
        try {
          const db = getDb();
          const products =  await db.collection('products').find().toArray();
          return products;
        } catch (error) {
          throw error;
        }
      }

      static async getProductID(id){
        try {
          const db = getDb();
          return await db.collection('products').findOne({_id:new ObjectId(id)});
          
        } catch (error) {
          
        }
      }

      static async updateProduct(id, updatedProduct) {
        try {
          const db = getDb();
          await db.collection('products').updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                name: updatedProduct.product,
                category: updatedProduct.categories,
                subCategory: updatedProduct.subCategory,
                brand: updatedProduct.brands,
                price: updatedProduct.price,
                discription: updatedProduct.description,
                stock : updatedProduct.stock,
                size: updatedProduct.Size,
              },
            }
          );
        } catch (error) {
          throw error;
        }
      }
      
     static async deleteProduct(id){
      try {
         const db = getDb();
         await db.collection('products').deleteOne({_id: new ObjectId(id)});
         console.log("product deleted");
      } catch (error) {
        console.log(error.message);
        
      }
     }
}

module.exports = Product;
