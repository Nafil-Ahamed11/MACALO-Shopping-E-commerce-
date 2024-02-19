const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config(); 
const { ObjectId, Collection } = require('mongodb');
const { getDb } = require('../config/dbConnection');
const Category = require('../models/modelCategory');
const Brand = require('../models/modelBrands');
const { consumers } = require('nodemailer/lib/xoauth2');
const Product = require('../models/modelProduct');
const { json } = require('express');
const getPagination = require('../helper/adminPagination');
const Coupon = require('../models/modelCoupon');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const PDFDocument = require('pdfkit');
const PDFTable = require('pdfkit-table');
const ExcelJS = require("exceljs");





const securePassword = async (password) => {
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      return passwordHash;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  };

const adminHome = async (req, res) => {
    try {
        res.render('home');
    } catch (error) {
        console.log(error.message); 
    }
}

const login = async (req,res) =>{
    try {
        res.render('admin-login');
    } catch (error) {
        console.log(error.message);
        
    }
}

const loginVerifiy = async (req,res) =>{
    try {

        const username = req.body.username;
        const password = req.body.password;
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if(username == adminUsername && password == adminPassword){
            res.render('home',{message:"login sucsessfuly"});

            req.session.admin = adminUsername;
            console.log('req.session.admin',req.session.admin);
        }else{
           res.render('admin-login',{message:"your password or username incorrect"});
        }
        
    } catch (error) {
        
    }
}

const customerList = async (req, res) => {
  try {
      const db = getDb();
      const collection = db.collection('users');
      const data = await collection.find().toArray();
      console.log('customers page entering')
      res.render('customers', { data }); 
  } catch (error) {
      console.log(error.message);
  }
}



const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId; 
        console.log("user id ",userId);
        const db = getDb();
        const collection = db.collection('users');
        const ObjectIdUserId = new ObjectId(userId);
        console.log('user _id ',ObjectIdUserId);
        const user = await collection.findOne( {_id:ObjectIdUserId} );
        if (!user) {
            return res.status(404).send('User not found');
        }

        const newStatus = !user.isBlocked;

      
        await collection.updateOne(
            { _id: ObjectIdUserId },
            { $set: { isBlocked: newStatus } }
        );

        res.redirect('/admin/customers');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error blocking/unblocking user');
    }
}

// category adding


const addCategory = async (req, res) => {
  try {
    const categoryName = req.body.categoryName;
    const subcategoryNames = req.body.subcategoryNames.split(',').map(s => s.trim());
    const db = getDb();
    const collection = db.collection('categories'); 
    const newCategory = new Category(categoryName, subcategoryNames);
    const result = await collection.insertOne(newCategory);

    res.redirect('/admin/list-Categorys'); 
  } catch (error) {
    console.error(error.message);
  }
};

const showCategoryList = async (req, res) => {
  try {
    const categories = await Category.getAllCategories();
    res.render('listCategory', { categories });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error fetching categories');
  }
};

// edit category 


const showEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id; 
    const category = await Category.getCategoryById(categoryId);
    res.render('editCategory', { category: category });
  } catch (err) {
    console.error(err);
  }
};


const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id; 
  
    const { categoryName, subcategoryNames } = req.body;
    await Category.updateCategory(categoryId, categoryName, subcategoryNames);
    res.redirect('/admin/list-Categorys'); 
  } catch (error) {
    console.error(error.message);
  }
};

const deleteCategorys = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log("categoryID", categoryId);
    await Category.deleteCategory(categoryId);
    res.redirect('/admin/list-Categorys');
  } catch (error) {
    console.log(error.message);
  }
};

// brands



const addBrand = async (req, res) => {
  try {
    const brandName = req.body.brandName;
    
  
    const db = getDb();
    const collection = db.collection('Brands'); 
    const newCategory = new Brand(brandName);
    const result = await collection.insertOne(newCategory);

    res.redirect('/admin/list-brand'); 
  } catch (error) {
    console.error(error.message);
  }
};

const showBrandList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const pageSize = 5; 
    const brands = await Brand.getAllbrands();

    const paginationData = await getPagination(
      brands,
      page,
      pageSize
    );
    
    res.render('listBrand', { paginationData});
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error fetching categories');
  }
};

const showEditBrand = async (req,res) =>{
  try {
    const brandID = req.params.id;
    console.log("brand id",brandID);
    const brand = await Brand.getBrandID(brandID);
    console.log("brand",brand);
    res.render('editbrand',{brand});
  } catch (error) {
    console.log(error.message);
    
  }
}

const editBrands = async (req,res) =>{
  try {
   const brandId = req.params.id;
    const {BrandName}=req.body;
    console.log("brand name",BrandName)
    console.log("categoryName");
    await Brand.updateBrand(brandId,BrandName);
    res.redirect('/admin/list-brand');
  } catch (error) {
    
  }
}

const deleteBrand = async (req, res) => {
  try {
    const brandID = req.params.id;
    console.log("categoryID", brandID);
    await Brand.deleteBrand(brandID);
    res.redirect('/admin/list-Brand');
  } catch (error) {
    console.log(error.message);
  }
};

// products 

const productPage = async (req,res) =>{
  try {
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    res.render('addProducts',{categories,brands});
  } catch (error) {
    console.log(error.message);
    
  }
}

const fecthSubCategory = async (req, res) => {
  const categoryId = req.params.categoryId;
  console.log("categoryID", categoryId);

  const subcategories = await Category.getSubcategoriesForCategory(categoryId);
  console.log("expected data",subcategories);
  res.json({ subcategories });
}


const addProducts = async (req, res) => {
  try {
     const body = JSON.parse(JSON.stringify(req.body));
     console.log("body",body);

      let { product, price, description, stock} = body
      const categoryId = body.category;
      const brandId = body.brand;
      const subcategory = body.subCategory;
     
      const images = req.files.map(file => file.path.replace('public', ''));
      const categoryObject = await Category.getCategoryById(categoryId);
      const brandObject = await Brand.getBrandID(brandId);
      const category = categoryObject.name;
      const brand = brandObject.name;

    
      const unitS = body.UnitS;
      const unitM = body.UnitM;
      const unitL = body.UnitL;
      const unitXL = body.UnitXL;
      const unitXXL = body.UnitXXL;
      const Us5 = body.UnitUs5;
      const Us6 = body.UnitUs6;
      const Us7 = body.UnitUs7;
      const Us8 = body.UnitUs8;
      const Us9 = body.UnitUs9;
      const Us10 = body.UnitUs10;
      

      const Size = {
        S :unitS?unitS:undefined,
        M :unitM?unitM:undefined,
        L :unitL?unitL:undefined,
        XL : unitXL?unitXL:undefined,
        XXL:unitXXL?unitXXL:undefined,
        US5:Us5?Us5:undefined,
        US6:Us7?Us7:undefined,
        US7:Us6?Us6:undefined,
        US8:Us8?Us8:undefined,
        US9:Us9?Us9:undefined,
        US10:Us10?Us10:undefined
        
      }

    

      for (const key in Size) {
        if (Size[key] === undefined) {
          delete Size[key];
        }
      }     
       let name = product.toUpperCase();
        price = parseInt(price)
     
      const newProduct = new Product(name, category,subcategory ,brand, price, description, images, stock, Size);
      if (newProduct.category) {
        delete newProduct.category.subcategories;
      }

      newProduct.name.toUpperCase();
      
        const db = getDb();
        const collection = db.collection('products');
        const result = await collection.insertOne(newProduct);
        res.redirect('/admin/list-Products'); 
        

  } catch (error) {
      console.log(error.message);
  }
};

const listProducts = async (req,res) =>{
  try {
    const page = parseInt(req.query.page) || 1; 
    const pageSize = 5; 
    const products = await Product.getAllproducts();
    const paginationData = await getPagination(
      products,
      page,
      pageSize
    )
    res.render('listProducts',{paginationData});
  } catch (error) {
    
  }
}

const listProductsEditPage = async (req, res) => {
  try {
    const productID = req.params.id;
    const product = await Product.getProductID(productID);
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    console.log("product",product);

    res.render('editProducts', { product, categories, brands });
  } catch (error) {
    console.error(error);
    res.redirect('/error');
  }
};

const editProduct = async (req, res) => {
  try {
    const body = JSON.parse(JSON.stringify(req.body));
    const { product, category, subCategory, brand, price, description,stock } = req.body;

    const productID = req.params.id;
   
    const categoriess = await Category.getCategoryById(category);
    const brandss = await Brand.getBrandID(brand);
    const categories = categoriess.name;
    const brands = brandss.name;
    
    

    const unitS = body.UnitS;
    const unitM = body.UnitM;
    const unitL = body.UnitL;
    const unitXL = body.UnitXL;
    const unitXXL = body.UnitXXL;
    const Us5 = body.UnitUs5;
    const Us6 = body.UnitUs6;
    const Us7 = body.UnitUs7;
    const Us8 = body.UnitUs8;
    const Us9 = body.UnitUs9;
    const Us10 = body.UnitUs10;

    const Size = {
      S: unitS ? unitS : undefined,
      M: unitM ? unitM : undefined,
      L: unitL ? unitL : undefined,
      XL: unitXL ? unitXL : undefined,
      XXL: unitXXL ? unitXXL : undefined,
      US5: Us5 ? Us5 : undefined,
      US6: Us7 ? Us7 : undefined,
      US7: Us6 ? Us6 : undefined,
      US8: Us8 ? Us8 : undefined,
      US9: Us9 ? Us9 : undefined,
      US10: Us10 ? Us10 : undefined,
    };

    for (const key in Size) {
      if (Size[key] === undefined) {
        delete Size[key];
      }
    }

    const updatedProduct = {
      product,
      categories,
      subCategory,
      brands,
      price,
      description,
      stock,
      Size,
    };

   
    updatedProduct.product = updatedProduct.product.toUpperCase();

    if (updatedProduct.categories) {
      delete updatedProduct.categories.subcategories;
    }

    console.log("Product updated: ", updatedProduct);

    await Product.updateProduct(productID, updatedProduct);

    res.redirect('/admin/list-products');
  } catch (error) {
    console.error(error);
    res.redirect('/error');
  }
};

const deleteProduct = async (req,res) =>{
  try {
    console.log("enterd here ")
    const productID = req.params.id;
    await Product.deleteProduct(productID);
    res.redirect('/admin/list-products');
  } catch (error) {
    console.log(error.message);
    
  }
}

// const addCoupon = async (req, res) => {
//   try {
//     let { name, offer, minPurchase, couponType, couponCode, expirationDate, status } = req.body;


//     offer = parseInt(offer);
//     minPurchase = parseInt(minPurchase);
//     name = name ? name.toUpperCase() : '';
//     couponType = couponType ? couponType.toUpperCase() : '';

//     const newCoupon = new Coupon(name, offer, minPurchase, couponType, couponCode, expirationDate, status);

//     const insertedId = await newCoupon.save();
//     console.log('inserted id is: ',insertedId);
//     res.redirect('/admin/list-coupon');
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const openAddCouponPage = async (req,res)=>{
  try {
    res.render('add-coupon')
  } catch (error) {
    console.log(error.message);
  }
}

const addCoupon = async (req, res) => {
  try {
    let { name, offer, minPurchase, couponType, couponCode, expirationDate, status } = req.body;

    // Check if all required fields are provided
    if (!name || !offer || !minPurchase || !couponType || !expirationDate || !status) {
      throw new Error("All fields are required.");
    }

    offer = parseInt(offer);
    minPurchase = parseInt(minPurchase);
    name = name.toUpperCase();
    couponType = couponType.toUpperCase();

    const newCoupon = new Coupon(name, offer, minPurchase, couponType, couponCode, expirationDate, status);

    const insertedId = await newCoupon.save();
    console.log('inserted id is: ', insertedId);
    res.redirect('/admin/list-coupon');
  } catch (error) {
    console.log(error.message);
    // Handle the error appropriately, e.g., send an error response to the client
    res.status(400).send(error.message);
  }
};



const listCoupon = async (req,res)=>{
    try {
      const db = getDb();
      const couponCollection = db.collection('coupon');

      const coupons = await couponCollection.find({}).toArray();
      res.render('coupon-list',{coupons});
    } catch (error) {
      console.log(error.message);
      
    }
}

const editCouponPage = async (req,res)=>{
  try {
    const db = getDb();
    const couponId = req.params.id;
    const coupon = await Coupon.getCouponByID(couponId);
    res.render('edit-coupon',{coupon});

  } catch (error) {
    console.log(error.message);
    
  }
}

const editCoupon = async (req,res)=>{
  try {
    const {name,offer,minPurchase,couponType,expirationDate,couponCode,status}=req.body;
    const couponId = req.params.id;
    console.log('name',name);
    console.log('coupon id',couponId);
    const updateCoupon ={
      name,
      offer,
      minPurchase,
      couponType,
      expirationDate,
      couponCode,
      status
    }


    await Coupon.updateCoupon(couponId,updateCoupon);
    res.redirect('/admin/list-coupon');
  } catch (error) {
    console.log(error.message);
    
  }
}

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    console.log('coupon id', couponId);

    const db = getDb();
    const couponCollection = db.collection('coupon');

    const query = { _id: new ObjectId(couponId) }; 
    await couponCollection.deleteOne(query);

    console.log('coupon deleted');
    res.redirect('/admin/list-coupon');
  } catch (error) {
    console.log(error.message);
  }
}


const orderList = async (req,res)=>{
  try {
    const page = parseInt(req.query.page) || 1; 
    const pageSize = 5; 
    const db = getDb();
    const orderCollection = db.collection('orders');
    const orders = await orderCollection.find().toArray();
    
    const paginationData = await getPagination(
      orders,
      page,
      pageSize
    )
    res.render('orders-list',{paginationData});

  } catch (error) {
    console.log(error.message);
  }
}

const orderUpdate = async (req,res)=>{
  try {
    const {orderId,newStatus}= req.body;
    console.log('oid',orderId);
    console.log('status',newStatus);
    const db = getDb();
    const orderCollection = db.collection('orders');
    const order = await orderCollection.updateOne({_id:new ObjectId(orderId)},{$set:{orderStatus:newStatus}});
    console.log('order',order);
    if(order.modifiedCount===1){
      res.redirect('/admin/list-orders');
    }
  } catch (error) {
    console.log(error.message);
  }
}


// chart

const showLineChart = async (req,res)=>{
  try {

    const db = getDb();

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() - 6);
    endOfWeek.setHours(23,59,59,999);
    const orderCollection = db.collection('orders');

    const userCollection = db.collection("users");


    const weekSales = await orderCollection.aggregate([
        {
          $group:{
            _id:{
              $dateToString : {format:"%Y-%m-%d",date:"$orderDate"}
            },
            count:{$sum:1}
          }
        },
        {
          $sort:{
            _id:-1
          }
        },
        {
          $limit:6
        },
        {
          $sort:{
            _id:1
          }
        }
    ]).toArray();

    const weekTotalRevenue = await orderCollection.aggregate([
      {
        $group:{
          _id:{
            $dateToString : {format:"%Y-%m-%d",date:"$orderDate"}
          },
          totalPrice: { $sum: { $toInt: "$total"}}
        }
      },
      {
        $sort:{
          _id:-1
        }
      },
      {
        $limit:6
      },
      {
        $sort:{
          _id:1
        }
      }
    ]).toArray();

    const weekTotalCustomers = await orderCollection.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$orderDate" }
          },
          uniqueCustomerIds: { $addToSet: { $toString: "$userID" } }
        }
      },
      {
        $project: {
          _id: 1,
          totalCustomers: { $size: { $ifNull: ["$uniqueCustomerIds", []] } }
        }
      },
      {
        $sort: {
          _id: -1
        }
      },
      {
        $limit: 6
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]).toArray();
    
   

    console.log('week Sale',weekSales);
    console.log('week total revenue',weekTotalRevenue);
    console.log('week coustomers',weekTotalCustomers)
    res.json({weekSales,weekTotalRevenue,weekTotalCustomers});
    
  } catch (error) {
    console.log(error.message);
  }
}


const weekSalesReport = async (req,res)=>{
  try {

    const db = getDb();
    const orderCollection = db.collection('orders');

    const currentDate = new Date();

    const weeklySalesData = await orderCollection.aggregate([
      {
          $match: {
              orderDate: { $gte: new Date(currentDate - 7 * 24 * 60 * 60 * 1000) }
          }
      },
      {
          $lookup: {
              from: 'users',
              localField: 'userID',
              foreignField: '_id',
              as: 'user'
          }
      },

        { $unwind: '$user' },

      {
          $group: {
              _id: '$_id', 
              orderId: { $first: '$_id' }, 
              customerName: { $first: '$user.name' },
              totalItems : {$first:'$totalItems'},
              totalPrice : {$first:'$total'},
              orderDate: { $first: '$orderDate' }, 
              status: { $first: '$orderStatus' } 
          }
      },
      {
          $project: {
              _id: 0, 
              orderId: 1,
              customerName: 1,
              totalItems : 1,
              totalPrice:1,
              orderDate: 1,
              status: 1,
              
          }
      }
  ]).toArray();

  console.log('weeklySalesDate',weeklySalesData);

  weeklySalesData.forEach(order => {
    console.log('Order ID:', order.orderId);
    for (let productId in order.products) {
        console.log('Product ID:', productId);
        console.log('Product:', order.products[productId]);
    }
});


    
    const filePath = await generateSalesReport(weeklySalesData, 'Weekly');

    res.download(filePath, 'WeeklySalesReport.xlsx', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        } else {
            fs.unlinkSync(filePath);
        }
    });
   
  } catch (error) {
    console.log(error.message);
  }
}

const monthSalesReport = async (req,res)=>{
  try {


    const db = getDb();
    const orderCollection = db.collection('orders');

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(),currentDate.getMonth(),1);

    const monthlySalesData = await orderCollection.aggregate([
      {
        $match: {
          orderDate: { $gte: firstDayOfMonth }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userID',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },

      {
          $group: {
              _id: '$_id', 
              orderId: { $first: '$_id' }, 
              customerName: { $first: '$user.name' },
              totalItems : {$first:'$totalItems'},
              totalPrice : {$first:'$total'},
              orderDate: { $first: '$orderDate' }, 
              status: { $first: '$orderStatus' } 
          }
      },
      {
          $project: {
              _id: 0, 
              orderId: 1,
              customerName: 1,
              totalItems : 1,
              totalPrice:1,
              orderDate: 1,
              status: 1,
              
          }
      }
      
    ]).toArray();

    const filePath = await generateSalesReport(monthlySalesData, 'Monthly');
    res.download(filePath, 'MonthlySalesReport.xlsx', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        } else {
            fs.unlinkSync(filePath);
        }
    });
   
  } catch (error) {
    console.log(error.message);
  }
}

const yearSalesReport = async (req,res)=>{
  try {

    const db = getDb();
    const orderCollection = db.collection('orders');

    const currentDate = new Date();
   
    const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);

    const yearlySalesData = await orderCollection.aggregate([
      {
        $match: {
          orderDate: { $gte: firstDayOfYear }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userID',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },

      {
          $group: {
              _id: '$_id', 
              orderId: { $first: '$_id' }, 
              customerName: { $first: '$user.name' },
              totalItems : {$first:'$totalItems'},
              totalPrice : {$first:'$total'},
              orderDate: { $first: '$orderDate' }, 
              status: { $first: '$orderStatus' } 
          }
      },
      {
          $project: {
              _id: 0, 
              orderId: 1,
              customerName: 1,
              totalItems : 1,
              totalPrice:1,
              orderDate: 1,
              status: 1,
              
          }
      }
    ]).toArray();


    const filePath = await generateSalesReport(yearlySalesData, 'Yearly');

    res.download(filePath, 'yearlySalesReport.xlsx', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        } else {
            fs.unlinkSync(filePath);
        }
    });


    
  } catch (error) {
    console.log(error.message);
  }
}




const generateSalesReport = async (salesData, reportType) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType);


  const headers = ['Order ID', 'Customer Name', 'Product Name', 'Total Price', 'Order Date', 'Status'];
  worksheet.addRow(headers);

  
  worksheet.columns = [
    { header: 'Order ID', key: 'orderId', width: 30, style: { alignment: { horizontal: 'center' } } },
    { header: 'Customer Name', key: 'customerName', width: 20, style: { alignment: { horizontal: 'center' } } },
    { header: 'Total Items', key: 'totalItems', width: 30, style: { alignment: { horizontal: 'center' } } },
    { header: 'Total Price', key: 'totalPrice', width: 15, style: { alignment: { horizontal: 'center' } } },
    { header: 'Order Date', key: 'orderDate', width: 20, style: { alignment: { horizontal: 'center' } } },
    { header: 'Status', key: 'status', width: 15, style: { alignment: { horizontal: 'center' } } }
];

worksheet.getRow(1).eachCell((cell) => {
  cell.alignment = { horizontal: 'center' };
});


salesData.forEach(data => {
    worksheet.addRow(data);
});


worksheet.eachRow((row, rowNumber) => {
    row.height = 20; 
});

const filePath = `${__dirname}/${reportType}SalesReport.xlsx`;
await workbook.xlsx.writeFile(filePath);

return filePath;
};


const showPieChart = async (req, res) => {
  try {
    console.log('enter pie backend')
    const db = getDb();
    const orderCollection = db.collection('orders');
    const cashOnDeliveryCount = await orderCollection.countDocuments({ paymentMethode: 'cashOnDelivery' });
    const onlineCount = await orderCollection.countDocuments({ paymentMethode: 'online' });

   
    console.log("Cash on Delivery Count:", cashOnDeliveryCount);
    console.log("Online Count:", onlineCount);

  
    res.status(200).json({ cashOnDeliveryCount, onlineCount });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}
















// module.exports = {
//   addCoupon,
// };










module.exports = {
    adminHome,
    login,
    loginVerifiy,
    customerList,
    blockUser,
    addCategory,
    showCategoryList,
    showEditCategory,
    editCategory,
    deleteCategorys,
    addBrand,
    showBrandList,
    showEditBrand,
    editBrands,
    deleteBrand,
    productPage,
    addProducts,
    fecthSubCategory,
    listProducts,
    listProductsEditPage,
    editProduct,
    deleteProduct,
    addCoupon,
    listCoupon,
    editCouponPage,
    editCoupon,
    orderList,
    orderUpdate,
    showLineChart,
    weekSalesReport,
    monthSalesReport,
    yearSalesReport,
    showPieChart,
    deleteCoupon,
    openAddCouponPage,
  
}
