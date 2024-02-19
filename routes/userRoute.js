const express = require('express');
const userRoute = express();
const bodyParser = require('body-parser');


userRoute.set('view engine','ejs');
userRoute.set('views','./views/users');
const authMiddleware = require('../middleware/userAuth');

userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({extended:true}));


const userController = require('../controller/userController');
// landing page.
userRoute.get('/',userController.loadHome);
// user home page.
userRoute.get('/home',authMiddleware.isLogin,userController.loginHome);
// registertaion sections
userRoute.get('/register',userController.loadRegister);
userRoute.post('/register',userController.insertUser);
userRoute.get('/verify-otp', userController.loadOTP);
userRoute.post('/verify-otp',userController.verifyOTP);
userRoute.get('/resend-otp', userController.resendOTP);

//login sections
userRoute.get('/login',authMiddleware.isLogout,userController.userlogin);
userRoute.post('/login',userController.loginSection);
userRoute.get('/logout',userController.userLogout);
userRoute.get('/forgetPass',userController.forgetPass)
userRoute.post('/forgetPass',userController.forgetOtp);
userRoute.get('/forgetRsendOtp',userController.forgetResend);
userRoute.post('/forgetOtpVerify',userController.forgetOTPvarify);
userRoute.post('/resetpassword',userController.resetPasswordVerify);

// shpo page 

userRoute.get('/shopPage',userController.shopPageLoad);

userRoute.get('/Clothes',userController.ClothesPageLoad);
userRoute.post('/filterProduct',userController.filterProduct);

userRoute.get('/shoes',userController.shoesPageLoad);
userRoute.post('/api/sort',userController.sorting);

//shop detiels page

// userRoute.get('/shop-detiels',userController.loadShopDetielsPage);
userRoute.get('/shop-detiels/:productId',userController.loadShopDetielsPage)
userRoute.get('/cart',userController.cartPage);

// cart
userRoute.post('/cartData',userController.cartData);
userRoute.post('/cartFiltering',userController.cartFilter);
userRoute.get('/remove-cart/:id',userController.removeCart);

// user accounts 
userRoute.get('/accounts',userController.userAccount);
// coupons
userRoute.get('/coupon-list',userController.couponList);
userRoute.post('/applay-coupon',userController.applayCoupon);

// checkout 
userRoute.get('/checkout',userController.loadCheckoutPage)
userRoute.post('/delivery-Address',userController.delivery_Adress);
userRoute.post('/selected-address',userController.selected_Adress);
userRoute.post('/chekout-details',userController.chekoutDetails);

// order placed 

userRoute.get('/order-placed/:oID',userController.orderPlaced);

// order status

userRoute.get('/order-details',userController.orderDetails);

userRoute.get('/order-status',userController.orderStatus);
userRoute.post('/rpSuccsess',userController.rpaySuccess);
userRoute.get('/cancle-order',userController.cancleOrder);

userRoute.post('/wishlist',userController.wishlists);
userRoute.get('/list-wishlist',userController.listWishlist);

userRoute.post('/delete-wishlist',userController.deleteWishlist);


















module.exports = userRoute;
