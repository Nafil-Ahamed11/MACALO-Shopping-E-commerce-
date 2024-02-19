const { getDb } = require('../config/dbConnection');
const { ObjectId } = require('mongodb');

class Category {
  constructor(name, subcategories = []) {
    this.name = name;
    this.subcategories = subcategories;
  }

  async save() {
    try {
      const db = getDb();
      const result = await db.collection('categories').insertOne(this);
      return result.insertedId;
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  static async getAllCategories() {
    try {
      const db = getDb();
      const categoriess =  await db.collection('categories').find({}).toArray();
      return categoriess;
    } catch (error) {
      throw error;
    }
  }

  static async getCategoryById(id) {
    try {
      const db = getDb();
      const categoryid = await db.collection('categories').findOne({ _id: new ObjectId(id) });
      return categoryid;
    } catch (error) {
      throw error;
    }
  }


  static async getSubcategoriesForCategory(categoryId) {
    try {
      const db = getDb();
      const category = await db.collection('categories').findOne({ _id: new ObjectId(categoryId) });

      if (category) {
        return category.subcategories;
      }

      return []; // No subcategories found for the given categoryId.
    } catch (error) {
      throw error;
    }
  }

  static async updateCategory(id, name, subcategoryNames) {
    try {
      const subcategories = subcategoryNames.split(',').map(item => item.trim());
      const db = getDb();
      await db.collection('categories').updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name,
            subcategories,
          },
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async deleteCategory(id) {
    try {
      const db = getDb();
      await db.collection('categories').deleteOne({ _id: new ObjectId(id) });
      console.log("Category deleted");
    } catch (error) {
      console.log(error.message);
    }
  }
  
}




module.exports = Category;
