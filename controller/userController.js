const bcrypt = require('bcrypt');
const User = require('../models/modelUser');
const { ObjectId } = require('mongodb');
const Category = require('../models/modelCategory');
const { getDb } = require('../config/dbConnection');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const { sendEmail } = require('../config/emailConfig');
const { Db } = require('mongodb');
const twilio = require('twilio');
const Brand = require('../models/modelBrands');
const Product = require('../models/modelProduct');
const getPagination = require('../helper/pagination');
const Cart = require('../models/modelCart');
const Coupon = require('../models/modelCoupon');
const getCouponToUser = require('../helper/add-userCoupon');
const addDeliveryAdress = require('../helper/add-deliveryAdress');
const Razorpay = require('razorpay');
const Orders = require('../models/modelOrders');
const { get } = require('../routes/userRoute');
const getHomePagination = require('../helper/homePagination');
const Wishlist = require('../models/modelWishlist');

const razorpay = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret
});



// password hashing
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

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// mobile otp generator twilio

async function sendSMS(mobile,otp) {
  console.log(mobile);
  console.log(otp);
  const client = new twilio(process.env.TWILIO_STD, process.env.TWILIO_AUTH_TOKEN);
  try {
    const message = await client.messages.create({
      body: `your otp is ${otp} `,
      from: '+12565008076',
      to: `+91${mobile}`,
    });
    console.log("Message is sent");
  } catch (err) {
    console.error("Message is not sent", err);
  }
}

const loadHome = async (req, res, next) => {
  const pageNum = parseInt(req.query.pages) || 1;

  try {
    console.log(req.session.user);
    const db = getDb();
    const collection = db.collection('products');
    const products = await collection.find().toArray()
    console.log('products',products);
    const pageSize = 8;
    const { paginationData, currentPage, totalPages } = await getHomePagination(collection, pageNum, pageSize);

    console.log('home paginationData',paginationData);
    if(!req.session.user){
      let userData = undefined
      res.render('Home',{ products: paginationData, currentPage, totalPages , userData});
    }else{  
      res.render('login-home',{userData:req.session.user,products: paginationData, currentPage, totalPages});
    }
  } catch (error) {
    console.error('error occurred', error);
  }
}

const loginHome = async (req,res) => {
  try {
    const pageNum = parseInt(req.query.pages) || 1;
    
    console.log('req.session.user: ',req.session.user);
    if(req.session.user){

      const db = getDb();
      const productCollection = db.collection('products');
      const collection = db.collection('users');
      const userData = await collection.findOne({email:req.session.user});
      const user = req.session.user;
      const Count =  await cartCount(user);

      const pageSize = 8;
      const { paginationData, currentPage, totalPages } = await getHomePagination(productCollection, pageNum, pageSize);

      res.render('Home',{userData,Count,products: paginationData, currentPage, totalPages})
    }else{
      res.render('Home',{products: paginationData, currentPage, totalPages})
    }
  } catch (error) {
    console.log(error.message);
    
  }
}
 
const loadRegister = async (req, res) => {
  try {
    res.render('registration');
  } catch (error) {
    console.error('error occurred', error);
  }
}

const insertUser = async (req, res) => {
  try {
    let { name, email, password, mobile } = req.body;
    console.log('email',email);
    console.log('name',name);
    console.log('password',password);
    console.log('mobile',mobile);
    const db = getDb();
    const collection = db.collection('users');
    const emailExists = await collection.findOne({ email });
    const mobileExists = await collection.findOne({ mobile });
    if(emailExists || mobileExists){
     res.render('registration',{message:"email or mobile exists"}) 
    }
    const otp = generateOTP();
    const timestamp = new Date().getTime();
    sendEmail(email, 'Email Verification OTP', `Your OTP is: ${otp}`); 
    password = await securePassword(password); 
    req.session.userData =  {name, email, password, mobile, otp,timestamp};
    setTimeout(async () => {
      await req.session.userData.otp == null;
    },60000);     
   console.log("sectiondata",req.session.userData);
   const userData = req.session.userData;
      if(userData){
      res.redirect(`/verify-otp`);
      }else{
        res.render('registration',{message : " registertaion field"});
      }
    
  } catch (error) {
    console.error(error);
  }
};

const loadOTP = async (req, res) => {
  try {
        const user = req.session.userData
        const timestamp = user.timestamp 
        console.log("",timestamp);
        res.render('verify-otp',{timestamp: timestamp});
      } catch (error) {
        console.error(error);
      }
    };   

    
    
const verifyOTP = async (req, res) => {
      try {
        const { otp } = req.body;
        console.log(otp);
        const db = getDb();
        const collection = await db.collection('users');
        const user = req.session.userData;
        console.log('userData',user);
        const currentTimestamp = new Date().getTime();
        const timeDifference = currentTimestamp - user.timestamp;
    
        if (user && user.otp === otp && timeDifference <= 60000) {
          const { name, email, mobile, password } = req.session.userData;
          let newUser = new User(name, email, mobile, password);
    
          // Wait for the user save operation to complete
          const result = await newUser.save();
    
    
          const couponCollection = db.collection('coupon');
          const coupons = await couponCollection.findOne({ couponType: 'WELCOME' })
    
         const couponDetails = {
          name : coupons.name,
          offer : coupons.offer,
          minPurchase:coupons.minPurchase,
          code:coupons.couponCode,
          expirationDate:coupons.expirationDate,
          status:coupons.status
         }
          console.log('coupon details',couponDetails);
  
          await getCouponToUser(collection, newUser, couponDetails);
    
          res.render('user-login', { message: 'Registration Complete' });
        } else {
          res.render('verify-otp', { message: 'Invalid OTP or OTP has expired' });
        }
      } catch (error) {
        console.error(error);
      }
    };
const resendOTP = async (req, res) => {
  try {
    console.log("resend enterd ");
    const user = req.session.userData;
    if (user && user.otp == null) {
    }
      const otp = generateOTP();
      req.session.userData.otp = otp;
      req.session.userData.timestamp = new Date().getTime();
      const email  = user.email;
      if(email){
      sendEmail(email, 'Email Verification OTP (Resent)', `Your OTP is: ${otp}. This OTP is valid for 1 minute.`);
       setTimeout(()=>{
         req.session.userData.otp = null;
         console.log("otp null")
       },60000) 
       
      return res.render('verify-otp', { message: 'OTP has been resent',email });
      }else{
        res.render('registration',{message : "please try one more"});
      }
  } catch (error) {
    console.error(error);
  }
};

 // user login

const userlogin = async (req,res) => {
   try {
    res.render('user-login');
   } catch (error) {
     console.log(error.message);
   }
}

const loginSection = async (req,res) => {
  try {
    const {email,password} = req.body;
    console.log(email);
    console.log(password);
    const db = getDb();
    const collection = db.collection('users');
    const findUser = await collection.findOne({ email });
  
    if(!findUser){
      return res.render('user-login',{message : "user not found"});
    }
    const isPassword = await bcrypt.compare(password,findUser.password);
    if(!isPassword){
      return res.render('user-login',{message : "Password incorrect"})
    }if(findUser.isBlocked){
      return res.render('user-login',{message:"user is blocked"});
      
    }else{
      req.session.user = findUser.email
      res.redirect('/home');
    }
 
  } catch (error) {
    console.log(error.message); 
  }
} 

const userLogout= async(req,res)=>{
  try {
      req.session.destroy();
      res.render('user-login'); 
  } catch (error) {
      console.log(error.message); 
  }
}

const forgetPass = async (req,res) => {
  try {
    res.render('forget-pass')
  } catch (error) {
    console.log(error.message);
  }
}

const forgetOtp = async (req,res) => {
  try {   
    const {mobile} = req.body;
    const {email} = req.body;
    console.log(mobile);
    console.log(email);
    const db = getDb();
    let value = email?email:mobile;
    const collection = db.collection('users');
    const findMobile = await collection.findOne({ mobile });
    const findEMail = await collection.findOne({ email });
    console.log(findEMail);
    console.log(findMobile);

    if(findMobile){
      const otp = generateOTP();
      const timestamp = new Date().getTime();
      req.session.sms = {mobile,otp,timestamp};
      console.log("checking section mobile",req.session.sms.mobile);
      console.log(otp);
      sendSMS(mobile,otp);
      res.render('forget-otp');

    }else if(findEMail){
      const otp = generateOTP();
      const timestamp = new Date().getTime();
      sendEmail(email, 'Email Verification OTP (Resent)', `Your OTP is: ${otp}. This OTP is valid for 1 minute.`);
      req.session.email = {email,otp,timestamp};
      res.render('forget-otp');

    }

  } catch (error) {
    console.log(error.message);
  }
}

const forgetOTPvarify = async(req,res)=>{
  try {
      
      const otp = req.body.otp;
      let message = "";

      if(req.session.sms){
      const mobileOTP = req.session.sms.otp;
      const timestamp = req.session.sms.timestamp;
      const currentTimestamp = new Date().getTime();
      const timeDifference = currentTimestamp - timestamp;
      if(otp == mobileOTP && timeDifference <= 60000){
        console.log("otp verified")
        res.render('forget-verification');
      }else{
        res.render('forget-otp',{ message:"otp expired or otp not match"});
      }
    }else if(req.session.email){
      const emailOtp = req.session.email.otp;
      const timestamp = req.session.email.timestamp;
      console.log("email otp",emailOtp);
      const currentTimestamp =new Date().getTime();
      const timeDifference = currentTimestamp-timestamp;
      if(otp == emailOtp && timeDifference <= 60000){
        console.log('otp verified')
        res.render('forget-verification')
      }else{
        res.render('forget-otp',{ message:"otp expired or otp not match"});
      }
    }
      
  } catch (error) {
    console.log(error.message);
  }
}



const forgetResend = async (req, res) => {
  try {
    res.render('forget-otp');
    console.log('resend entered');
    const mobile = req.session.sms ? req.session.sms.mobile : null;
    const email = req.session.email ? req.session.email.email : null;

    console.log(mobile);
    if (mobile) {
      const otp = generateOTP();
      const timestamp = new Date().getTime();
      req.session.sms.otp = otp; 
      req.session.sms.timestamp = timestamp; 
      req.session.save();
      sendSMS(mobile, otp);
      console.log('resend otp =', otp);
    }else if(email){
      const otp = generateOTP();
      const timestamp = new Date().getTime();
      req.session.email.otp = otp; 
      req.session.email.timestamp = timestamp; 
      req.session.save();
      sendEmail(email, 'Email Verification OTP (Resent)', `Your OTP is: ${otp}. This OTP is valid for 1 minute.`);
     
    }
  } catch (error) {
    console.log(error.message);
  }
}

const resetPasswordVerify = async (req, res) => {
  try {
    let password = req.body.password;
    password = await bcrypt.hash(password, 10);

    const mobile = req.session.sms ? req.session.sms.mobile : null;
    const email = req.session.email ? req.session.email.email : null;

    console.log("resetpassword", password);
    
    console.log("here user", mobile);

    if (mobile) {
      const db = getDb();
      const collection = db.collection('users'); 
      const Data = await collection.findOne({mobile});
      const result = await collection.updateOne({ mobile }, { $set: { password } });

      if (result.modifiedCount === 1) {
        res.render('user-login', { message: "Password reset successfully" });
        console.log("updated")
      } else {
        res.render('user-login', { message: "Password reset failed" });
        console.log("not updated");
      }
    } else if(email) {
      const db = getDb();
      const collection = db.collection('users'); 
      const Data = await collection.findOne({email});
      const result = await collection.updateOne({ email }, { $set: { password } });

      if (result.modifiedCount === 1) {
        res.render('user-login', { message: "Password reset successfully" });
        console.log("updated")
      } else {
        res.render('user-login', { message: "Password reset failed" });
        console.log("not updated");
      }
       
    }
  } catch (error) {
    console.log(error.message);
  }
}

// shop page 

const  shopPageLoad = async (req,res) =>{
  try {
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    res.render('shop',{ categories,brands })
    
  } catch (error) {
    console.log(error.message);
  }
}

const ClothesPageLoad = async (req, res) => {
  const pageNum = parseInt(req.query.pages) || 1;

  try {
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    const products = await Product.getAllproducts();
    const db = getDb();
    const userID = req.session.user;
    console.log('category page userID',userID)
      const Usercollection = db.collection('users');
    const userData = await Usercollection.findOne({email:userID});
    console.log('user id',userID);
    const Count = await cartCount(userID);
    console.log('category page count',Count)
    const collection = db.collection('products');
    const perPage = 6; 
    
    const categoryQuery = {
      category: 'Clothes',
  };

  const { paginationData, currentPage, totalPages, totalCount } = await getPagination(
      collection,
      pageNum,
      perPage,
      categoryQuery
  ); 

    res.render('clothes', { categories, brands, products, paginationData,Count, currentPage, totalPages, totalCount,userData:userID });

  } catch (error) {
    console.log(error.message);
  }
};


const shoesPageLoad = async (req,res) =>{
  const pageNum = parseInt(req.query.pages,10) || 1;
  try {
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    const products = await Product.getAllproducts();
    const db = getDb();
    const userID = req.session.user;
    const Count = await cartCount(userID);
    const collection = db.collection('products');
    const perPage = 12;

    const categoryQuery = {
      category: 'shoes',
  };

  const { paginationData, currentPage, totalPages, totalCount,startCount:start,endCount:end } = await getPagination(
    collection,
    pageNum,
    perPage,
    categoryQuery
); 

console.log('shoes page u data',userID)

    res.render('shoes',{ userData:userID, categories, brands, products, paginationData, currentPage,Count, totalPages, totalCount,start,end });
  } catch (error) {
    
  }
}

const filterProduct = async (req,res)=>{
  try {
    
         
    let {category,brand,price,size,currentShopPage}=req.body;

    const db = getDb();
    const collection = db.collection('products');

    let min, max;

    if (Array.isArray(price) && price.length > 0) {
      for (const priceObj of price) {
        const { min: currentMin, max: currentMax } = priceObj;
        // Use parseInt to convert the values to integers
        min = parseInt(currentMin, 10);
        max = parseInt(currentMax, 10);
      }
    } else {
      // If price is not an array, set default values or handle accordingly
      min = 0;
      max = Infinity;
    }

    parseInt(size);

      
        const sizeFilter = Array.isArray(size)
      ? size.map((size) => ({ [`size.${size}`]: { $gte: 1 } }))
      : [];

       const combinedSizeFilter = sizeFilter.length > 0 ? { $or: sizeFilter } : {};


    const query = {

      ...combinedSizeFilter,   
      ...(category && category.length > 0 ? { subCategory: { $in: category } } : {category:currentShopPage}),
      ...(brand && brand.length > 0 ? { brand: { $in: brand } } : {category:currentShopPage}),
      ...(price && price.length > 0 ? { price:{$gte: min, $lte: max }}:{category:currentShopPage} ),
      
    }

    const filterData = await collection.find(query).toArray();
    res.json({success:true,filterData});

  } catch (error) {
    console.log(error.message);
    
  }
}

const sorting = async (req,res)=>{
  try {
    console.log('sorting enter');
    const sortBy = req.body.sortBy;
    console.log('sortby',sortBy);
  } catch (error) {
    console.log(error.message);
  }
}

const loadShopDetielsPage = async (req, res) => {
  try {
      const userID = req.session.user;
      console.log('ussr id',userID);
      const productId = req.params.productId;
      const product = await Product.getProductID(productId);
      const productList = await Product.getAllproducts();
      const uniqueProductSubcategory = product.subCategory;
     
      const Count = await cartCount(userID);
      const relatedProducts = productList.filter(
          (relatedProduct) =>
              relatedProduct.subCategory === uniqueProductSubcategory &&
              relatedProduct._id.toString() !== productId
      );

      res.render('shop-detiels', { product,relatedProducts,userID,Count, userData:userID });
  } catch (error) {
      console.log(error.message);
  }
};

const cartData = async (req, res) => {
  try {
    const productiD = req.body.productID;
    const productID = new ObjectId(productiD);
    const userEmail = req.body.user;
    const size = req.body.size;
    console.log('userEmail',userEmail);

    if (userEmail == null || userEmail === 'null') {
      return res.json({ success: false, message: 'please login' });
    }
    

    const db = getDb();
    const cartCollection = await db.collection('cart');

    const existingCartItem = await cartCollection.findOne({
      email: userEmail,
      'cart.product.id':productID,
      'cart.product.size': size,
    });
      

    if (existingCartItem) {
      return res.json({ success: true,    message: 'product already in cart'});
    } else {
      const userCart = await cartCollection.findOne({ email: userEmail });

      if (userCart) {
        await cartCollection.updateOne(
          { email: userEmail },
          {
            $push: {
              cart: {
                product: {
                  id: productID,
                  size: size,
                  quantity: 1,
                },
              },
            },
          }
        );
        const Count = await cartCount(userEmail);
        console.log('jjj count',Count);
        return res.json({ success: true,    message: 'Product added to the cart',Count:Count});
      } else {
        
        const newCart = {
          email: userEmail,
          cart: [
            {
              product: {
                id: productID,
                size: size,
                quantity: 1,
              },
            },
          ],
        };

        const result =  await cartCollection.insertOne(newCart);
         const insertedID =   result.insertedId;
        console.log('result',insertedID);
        
      }
      const Count = await cartCount(userEmail);
      return res.json({ success: true,    message: 'Product added to the cart',Count:Count});
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const cartCount = async (user)=>{
  try {
    if(user == null || user == 'null'){
     
      console.log('no user');
      return 0;
    }
    const db = getDb();
    const cartCollection = await db.collection('cart');
    const userCart = await cartCollection.findOne({email:user});

    if(userCart){
      console.log('userCart',userCart);
      const cartCount = userCart.cart.length;
      console.log('cartCount',cartCount);
      return cartCount
    }
  } catch (error) {
    console.log(error.message);
  }
} 


const cartPage = async (req, res) => {
  try {
    const user = req.session.user;
    const db = getDb();
   

   
    const cartDetails = await db.collection('cart').aggregate([
      {
        $match: { email: user } 
       
      },
      {
        $unwind: '$cart' 
        
      },
    
      {
        $lookup: {
          from: 'products', 
          localField: 'cart.product.id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $project: {
          _id: 0,
          email: 1,
          'cart.product': 1,
          'productDetails.name': 1,
          'productDetails.price': 1,
          'productDetails.image': 1,
        }
      }
    ]).toArray();
    
    cartDetails.forEach((cartItem, index) => {
      console.log(`Item ${index + 1}:`, cartItem);
    });

    req.session.cartDetails = cartDetails;

    console.log('cartdetiels',cartDetails);


    
    if (req.session.appliedCoupon) {
      const cartTotals = calculateCartTotal(cartDetails);

      if (cartTotals.total !== req.session.appliedCoupon.discountedTotal) {
        delete req.session.appliedCoupon;
      }
    }

    const cartTotals = calculateCartTotal(cartDetails);

    res.render('cart', { cartDetails,cartTotals,userData:user });
  } catch (error) {
    console.log(error.message);
   
  }
};

const cartFilter = async (req, res) => {
  try {
    const { action, productID, userID, selectedSize } = req.body;
    const productId = new ObjectId(productID);
    const actionValue = parseInt(action);

    console.log('action', actionValue);
    console.log('productid', productId);
    console.log('userid', userID);
    console.log('size', selectedSize);

    const db = getDb();
    const cartCollection = await db.collection('cart');

   
    const product = await db.collection('products').findOne({ _id: productId });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found in the product collection' });
      return;
    }

    const userCart = await cartCollection.findOne({
      email: userID,
      'cart': {
        $elemMatch: {
          'product.id': productId,
          'product.size': selectedSize
        }
      }
    });

    console.log('user cart', userCart);

    if (userCart) {
      const cartItem = userCart.cart.find(item => item.product.id.equals(productId) && item.product.size === selectedSize);

      if (cartItem) {
        let newQuantity;

        if (actionValue === 1) {
          newQuantity = cartItem.product.quantity + 1;
          

          const maxQuantity = product.size[selectedSize];

        
          const maxLimit = maxQuantity;
          console.log('maxLimit',maxLimit);

          if (newQuantity > maxLimit) {
            newQuantity = maxLimit;
          }

          if (newQuantity > maxQuantity) {
            res.json({ success: false, message: 'Exceeds available stock for selected size' });
            return;
          }
        } else if (actionValue === -1) {
          newQuantity = cartItem.product.quantity - 1;

          if (newQuantity < 1) {
            newQuantity = 1;
          }
        } else {
         
        }

        await cartCollection.updateOne(
          { email: userID, 'cart.product.id': productId, 'cart.product.size': selectedSize },
          { $set: { 'cart.$.product.quantity': newQuantity } }
        );

        req.session.cartDetails = await db.collection('cart').aggregate([
          {
            $match: { email: userID }
          },
          {
            $unwind: '$cart'
          },
          {
            $lookup: {
              from: 'products',
              localField: 'cart.product.id',
              foreignField: '_id',
              as: 'productDetails'
            }
          },
          {
            $project: {
              _id: 0,
              email: 1,
              'cart.product': 1,
              'productDetails.name': 1,
              'productDetails.price': 1,
              'productDetails.image': 1,
            }
          }
        ]).toArray();


        res.json({ success: true, message: 'Quantity updated successfully', newQuantity });
        return;
      }
    }

    res.status(404).json({ success: false, message: 'Product not found in the cart' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const removeCart = async (req,res)=>{
  try {
    const cartId = req.params.id;
    const cartID = new ObjectId(cartId)
    const user = req.session.user;
    const size = req.query.size;

    console.log('size removing',size); 
    
    const db = getDb();
    const cartCollection = db.collection('cart');

    const result = await cartCollection.updateOne(
      {email:user,'cart.product.id':cartID,'cart.product.size':size},
      {$pull:{'cart':{'product.id':cartID,'product.size':size}}}
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Product with ID ${cartID} removed from the cart`);
    } else {
      console.log(`Product with ID ${cartID} not found in the cart`);
    }

    res.redirect('/cart');

  } catch (error) {
    console.log(error.message);
    
  }
}

const calculateCartTotal = (cartDetails)=>{
  let subTotal = 0
  cartDetails.forEach(cartItem=>{
    subTotal+=cartItem.productDetails[0].price * cartItem.cart.product.quantity;
  });

  const total = subTotal;
  return {
    subTotal,
    total
  };
}

const couponList = async (req,res)=>{
  try {
    const db = getDb();
    const collection = db.collection('users');
    const user = req.session.user
    console.log('user',user);
    const userCollection = await collection.findOne({
      email:user
    });
    console.log('userCollection',userCollection);

  
      console.log('enterd to userCollection coupon')
      res.render('coupon-list',{userCollection,userData:user});
   

   
  } catch (error) {
    console.log(error.message);
  }
}

const applayCoupon = async (req,res)=>{
  try {
    const code = req.body.code;
    const user = req.session.user;
    const cartDetails = req.session.cartDetails;
    console.log('cartDetails',cartDetails);
    console.log('coupon code',code);
    const db = getDb();
    const collection = db.collection('users');
    const userCollection = await collection.findOne({
      email:user
    });
   
    if(userCollection){
     console.log('2')
      const coupon = userCollection.coupons.find(c => c.code === code);
      if(coupon && coupon.status === 'active' && new Date(coupon.expirationDate)>new Date()){
        const cartTotals = calculateCartTotal(cartDetails);

        const discountPercentage = coupon.offer / 100;
        console.log('3')
        const discountedTotal = cartTotals.total * (1 - discountPercentage);
      
        const discount = cartTotals.subTotal-(discountedTotal);
        
         req.session.appliedCoupon = {
          code:code,
          discountedTotal:discountedTotal,
          discount:discount
        }
        console.log('4');
        res.json({ success: true, message: 'Coupon applied successfully', discountedTotal,discount });
        return;
      }else{
       console.log('5');
        res.json({ success: false, message: 'Invalid or expired coupon code' });
        return;
      }
    }
    res.json({ success: false, message: 'User not found' });
  } catch (error) {
    console.log(error.message);
  }
}

const loadCheckoutPage = async (req,res)=>{
  try {
    const user = req.session.user;
    const db = getDb();
    const collection = db.collection('users');
    const cartDetails = req.session.cartDetails
    const discount = req.session.appliedCoupon ? Math.floor(req.session.appliedCoupon.discount) : 0;
    const couponCode = req.session.appliedCoupon ? req.session.appliedCoupon.code : 0;

    const userCollection = await collection.findOne({email:user});

    const userAddress = userCollection.addresses;
    console.log('addresses',userAddress);
    
    const totalItems = cartDetails.reduce((total, cartItem) => total + cartItem.cart.product.quantity, 0);

    const subTotal = cartDetails.reduce((total, cartItem) => {
      return total + cartItem.productDetails[0].price * cartItem.cart.product.quantity;
    }, 0);

    const total = subTotal - discount;

    console.log('total',total);
    console.log('subTotal',subTotal);
    console.log('totalItems',totalItems);

   
    res.render('checkout',{totalItems,subTotal,discount,total,couponCode,user,userAddress,userCollection,userData:user});
  } catch (error) {
    console.log(error.message);
  }
}

const userAccount = async (req,res)=>{
  try {
    const userEmail  = req.session.user;
    const db = getDb();
    const collection = db.collection('users');
    const user = await collection.findOne({email:userEmail})
    res.render('userAccount',{user});
  } catch (error) {
    console.log(error.message);
  }
}

const delivery_Adress = async (req,res)=>{
  try {
    console.log('enterd delivery adderss');
    const user = req.session.user
    const db = getDb();
    const collection = db.collection('users')
    const userCollection = await collection.findOne({email:user});

  

    const {name,Email,country,state,pincode,streetAdress,houseAdress,twonAdress,phone } = req.body;
    
    const addressId = new ObjectId();

    const deliveryAdress = {
      _id: addressId,
      name:name,
      email:user,
      country:country,
      state:state,
      pincode:pincode,
      streetAdress:streetAdress,
      houseAdress:houseAdress,
      twonAdress:twonAdress,
      phone:phone
    }

    await addDeliveryAdress(collection,user,deliveryAdress);

    res.redirect('/checkout');

  } catch (error) {
    console.log(error.message);
  }
}

const selected_Adress = async (req,res)=>{
  try {
    const selectedAddress = req.body.selectedAddress;
    
  } catch (error) {
    console.log(error.message);
  }
};

const chekoutDetails = async (req, res) => {
  try {
    const orderData = req.body.orderData;
    const user = req.session.user;
    const cartDetails = req.session.cartDetails;
    const db = getDb();
    const collection = db.collection('users');
    const userCollection = await collection.findOne({ email: user });
    const orderDate = new Date();
    const cartCollection = db.collection('cart');

 
    let deliveryDate =  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    let dd = deliveryDate.getDate();
    let mm = deliveryDate.getMonth() + 1;
     
    let yyyy = deliveryDate.getFullYear();
     
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    deliveryDate = dd + '/' + mm + '/' + yyyy;
     
    console.log('deliveryDate',deliveryDate);

    let status = orderData.paymentMethod==='cashOnDelivery'?'placed':'pending';
    console.log('status',status);

    const order = new Orders(
      userCollection,
      cartDetails,
      orderData,
      orderDate,
      deliveryDate,
      status
      )

    const orderId = await order.save();
    console.log('Order saved successfully. Order ID:', orderId);

   
    if (orderData.paymentMethod === 'cashOnDelivery') {

      console.log('order id',orderId);
      const db = getDb();
      const orderCollection = db.collection('orders');
      const productCollection = db.collection('products');
      
      
      await updateQuantity(orderCollection,productCollection,orderId);
      await cartCollection.deleteOne({email:user});
       res.json({cashOnDelivery:true,orderId:orderId});
      
    } else if(orderData.paymentMethod === 'online') {
       console.log('enterd online pay ');
      
      const rp =  await razorPay(orderData,orderId);
        res.json({ success:true, rpOrder:rp,orderId});
    }else{
      
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false,error });
  }
};


const razorPay = async (orderData, orderId) => {
  try {
    console.log('orderdata',orderData);
    console.log('orderID',orderId)
    console.log('total',orderData.total);
    return new Promise((resolve, reject) => {
      var instance = new Razorpay({
        key_id: process.env.key_id,
        key_secret: process.env.key_secret
      });

      var rp = {
        amount: orderData.total * 100,
        currency: "INR",
        receipt: orderId,
        
      
      };

      instance.orders.create(rp, function(err, order) {
        if (err) {
          console.error('Razorpay API Error:', err);
          reject(err);
        } else {
          console.log('order', order);
          resolve(order);
        }
      });
    });
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

const orderPlaced = async (req,res)=>{
  try {
    const oID = new ObjectId(req.params.oID);
   
    const db = getDb();
    const orderCollection = db.collection('orders');
    const orderDetails = await orderCollection.findOne({_id:oID})

    const productIds = orderDetails.orderList.map(item => new ObjectId(item.id));
    const productCollection = db.collection('products');
    const products = await productCollection.find({ _id: { $in: productIds } }).toArray();

   
    res.render('order-succsess',{orderDetails,products});
  } catch (error) {
    console.log(error.message);
  }
}


async function updateQuantity(orderCollection, productCollection, orderID) {
  console.log('quantity function entered')
  const db = getDb();
  const orderData = await orderCollection.findOne({ _id: orderID });

  for (let orderList of orderData.orderList) {
    const productId = new ObjectId(orderList.id);  // Convert string to ObjectId
    const selectedSize = orderList.size;
    const quantityToDecrease = orderList.quantity;

  
    try {
      const product = await productCollection.findOne({ _id: productId });
      if (product && product.size && product.size[selectedSize] >= quantityToDecrease) {
        await productCollection.updateOne(
          { _id: productId },
          {
            $inc: {
              [`size.${selectedSize}`]: -quantityToDecrease
            }
          }
        );

        const product = await productCollection.findOne({ _id: productId });
        if (product.size[selectedSize] === 0) {
          await productCollection.updateOne(
            { _id: productId },
            { $unset: { [`size.${selectedSize}`]: 1 } }
          );
        }
        console.log('quantity decreased for size', selectedSize);
      } else {
        console.log('Insufficient stock for size', selectedSize);
      }
    } catch (error) {
      console.log(error.message);
    }
  }
}


const orderDetails = async (req, res) => {
  try {
    console.log('enterd order details page')
    const oID = req.query.oID;
    console.log('OID',oID);
    const db = getDb();
    const user = req.session.user
    const orderCollection = db.collection('orders');
    const productCollection = db.collection('products');
    // const userCollection = db.collection('users');
    // const userID = await userCollection.findOne({email:user})
    const orders = await orderCollection.find({ _id:new ObjectId(oID)}).toArray();
    const orderedProducts = orders.flatMap(order => order.orderList.map(item => new ObjectId(item.id)));
    
    console.log('orders...',orders);
    console.log('ordered products...',orderedProducts);

    const products = await productCollection.find({ _id: { $in: orderedProducts } }).toArray();
    console.log('produts....',products);
    res.render('order-details', {products,orders,userData:user});
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

const rpaySuccess = async(req,res)=>{
  try {
    const user = req.session.user
    console.log('req.body.orderId',req.body.orderId);

    const oID = req.body.orderId;
    const paymentStatus = Boolean(req.body.paymentStatus);
    console.log('payment status...',paymentStatus)
    const db = getDb();
    const collection = db.collection('orders');
    if(paymentStatus===true){
      console.log('order status is true')
      const result =  await collection.updateOne({_id:new ObjectId(oID)},{$set:{orderStatus:'placed'}});
      if(result.modifiedCount === 1){
      const productCollection = db.collection('products');
      await updateQuantity(collection,productCollection,new ObjectId(oID));
      const cartCollection = db.collection('cart');
      await cartCollection.deleteOne({email:user});

      res.json({success:true,isRpaySuccess:true,oID});
      }else{
        res.json({isRpaySuccess:false});
        const result = await collection.deleteOne({_id:new ObjectId(oID)});
        console.log('order collection deleted')
        }
      }else{
        const result = await collection.deleteOne({_id:new ObjectId(oID)});
        console.log('order collection deleted')
      }
      
      } catch (error) {
        res.status(500).json({message:error})
        console.error(error);
      }
    }

  const orderStatus = async (req, res) => {
    try {
    const user = req.session.user;

    const db = getDb();

    const userCollection = db.collection('users');
    const userID = await userCollection.findOne({ email: user });
    
    if (!userID) {
      console.log('User not found');
      return res.render('order-status');
    }

    const orderCollection = db.collection('orders');
    const userOrders = await orderCollection.aggregate([
      { $match: { userID: userID._id } },
      {
        $lookup: {
          from: 'products',
          let: { orderListIds: '$orderList.id' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', { $map: { input: '$$orderListIds', as: 'id', in: { $toObjectId: '$$id' } } }] }
              }
            }
          ],
          as: 'orderedProducts'
        }
      }
    ]).toArray();

    console.log('user orders', userOrders);

    res.render('order-status', { userOrders,userID});
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const cancleOrder = async (req,res)=>{
  try {

    const userEmail = req.session.user;
    const oID = req.query.oID;
    const db = getDb();
    // const userCollection = db.collection('users');
    // const userID = await userCollection.findOne({email:userEmail})
    // const orderCollection = db.collection('orders');

    // await orderCollection.deleteOne({oID});
    
  } catch (error) {
    console.log(error.message);
  }
}

const wishlists = async(req,res)=>{
  try {
    const  productID = new ObjectId(req.body.productID) ;
    const user = req.body.user;

    new ObjectId(productID)
    console.log('productId',productID);
    console.log('user',user);

    const db = getDb();
    const wishlistCollection = await db.collection('wishlist');

    if(user ==null || user == 'null'){
      return res.json({success:true, message: 'please login'});
    }

    const existingwishlistItem = await wishlistCollection.findOne({
      userID:user,
      product: productID,
    });

    if(existingwishlistItem){
      return res.json({success:true, message: 'product already in wishlist'});
    }else{
     
      const result = new Wishlist(user, productID);
      console.log('result', result);
      const insertedId = await result.save(); // Call the save function
      console.log('Inserted ID:', insertedId);
      return res.json({ success: true, message: 'Product added to the wishlist' });

  } 
 
}catch (error) {
   console.log(error.message)
  }
}


const listWishlist = async (req, res) => {
  try {
      const user = req.session.user;
      const db = getDb();
      const userWishlist = await db.collection('wishlist').aggregate([
          {
              $match: { userID: user }
          },
          {
              $lookup: {
                  from: 'products', // This should be the name of the collection to join with
                  localField: 'product',
                  foreignField: '_id',
                  as: 'productDetails'
              }
          },
          {
              $project: {
                  _id: 0,
                  email: 1,
                  'productDetails.name': 1,
                  'productDetails.price': 1,
                  'productDetails.image': 1,
                  'productDetails._id':1
              }
          }
      ]).toArray();

      console.log('user wishlist', userWishlist);
      res.render('wishlist', { wishlistItems: userWishlist,userData:user });
  } catch (error) {
      console.log(error.message);
  }
}

const deleteWishlist = async(req,res)=>{
  try {
    const  productID = new ObjectId(req.body.productID) ;
    const user = req.body.user;

    console.log('delte pID',productID);
    console.log('dele user',user);

    const db = getDb();

    const collection = db.collection('wishlist');
    const deleted  = await collection.deleteOne({userID:user},{product:productID});
    if(deleted){
      console.log('deleted');
      res.json({ success: true, message: 'Product removed to the wishlist' });
    }
  } catch (error) {
    console.log(error.message);
  }
}






 


module.exports = {
  loadRegister,
  loadHome,
  insertUser,
  loadOTP,
  verifyOTP,
  resendOTP,
  userlogin,
  loginSection,
  loginHome,
  userLogout,
  forgetPass,
  forgetOtp,
  forgetOTPvarify,
  resetPasswordVerify,
  forgetResend,
  shopPageLoad,
  ClothesPageLoad,
  shoesPageLoad,
  filterProduct,
  sorting,
  loadShopDetielsPage,
  cartPage,
  cartData,
  cartFilter,
  removeCart,
  loadCheckoutPage,
  userAccount,
  couponList,
  applayCoupon,
  delivery_Adress,
  selected_Adress,
  orderDetails,
  orderPlaced,
  chekoutDetails,
  rpaySuccess,
  orderStatus,
  cancleOrder,
  wishlists,
  listWishlist,
  deleteWishlist

 

};
