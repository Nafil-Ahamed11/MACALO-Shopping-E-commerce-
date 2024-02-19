const { getDb } = require('../config/dbConnection');
const { ObjectId } = require('mongodb');

class Brand{
    constructor(name){
        this.name = name;
        
    }

    async save(){
        try {
            const db = getDb;
            const result = await db.collection('Brand').insertOne(this);
            return result.insertedId;
        } catch (error) {
            console.log(error.message);
        }
    }

    static async getAllbrands() {
        try {
          const db = getDb();
          const brands =  await db.collection('Brands').find().toArray();
          return brands;
        } catch (error) {
          throw error;
        }
      }

      static async getBrandID(id){
        try {
          const db = getDb();
          return await db.collection('Brands').findOne({_id:new ObjectId(id)});
          
        } catch (error) {
          
        }
      }

      static async updateBrand(id, name, category) {
        try {
          const categories = category.split(',').map(item => item.trim());
          console.log("update id", id);
          console.log("names", name);
          console.log("cate", categories); // Use the 'categories' variable, not 'category'
          const db = getDb();
          await db.collection('Brands').updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                name,
                category: categories, // Update 'category' with the 'categories' array
              },
            }
          );
        } catch (error) {
          console.log(error.message);
        }
      }


      static async deleteBrand(id) {
        try {
          const db = getDb();
          await db.collection('Brands').deleteOne({ _id: new ObjectId(id) });
          console.log(" deleted brands");
        } catch (error) {
          console.log(error.message);
        }
      }
      
}

module.exports=Brand;