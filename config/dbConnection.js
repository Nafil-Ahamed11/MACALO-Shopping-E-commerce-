const { MongoClient } = require('mongodb');
const dotenv = require('dotenv').config(); 

const uri = process.env.DATABASE_URI;

const dbName = 'MACALO-DB';

let db ;
const client = new MongoClient(uri);

async function connectMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    db = client.db();
    await createUniqueIndex();
  } catch (error) {
    console.log('Error connecting to the database:', error);
    throw error;
  }
};

const getDb = ()=>{
  if(db){
    return db;
  }else{
    throw new Error('Database connection not established yet.')
  }
}

const createUniqueIndex = async () => {
  try {
    const db = getDb();

    // Create unique indexes with unique names
    await db.collection('users').createIndex({ email: 1 }, { name: 'unique_email_index' });
    // await db.collection('users').createIndex({ mobile: 1 }, { name: 'unique_mobile_index' });
    // await db.collection('category').createIndex({ categoryName: 1 });
    // await db.collection('brand').createIndex({ brandName: 1 }, { name: 'unique_brandName_index' });
  } catch (error) {
    console.log(error);
  }
}

module.exports ={
  connectMongoDB,
  getDb
}  
