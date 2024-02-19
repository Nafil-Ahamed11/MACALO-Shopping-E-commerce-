const addDeliveryAdress = async (userCollection, userEmail,address)=>{
    try {
       
        if(userEmail){
            await userCollection.updateOne(
                { email: userEmail },
                {
                  $push: {
                    addresses: address,
                  },
                }
              );
        }
        

        return 'Address added successfully';

    } catch (error) {
        console.log(error.message);
    }
};


module.exports = addDeliveryAdress;