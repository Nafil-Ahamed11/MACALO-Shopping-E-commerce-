const getCouponToUser = async (userCollection, user, couponDetails) => {
    try {
      console.log('function entered');
      console.log('user', user);
      console.log('couponDetails', couponDetails);
  
      const currentDate = new Date();
      if( couponDetails.status === 'active' && new Date(couponDetails.expirationDate) > currentDate) {
        user.coupons = user.coupons || [];
        user.coupons.push(couponDetails);
  
        await userCollection.updateOne({ _id: user._id }, { $set: { coupons: user.coupons } });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  
  module.exports = getCouponToUser;
  