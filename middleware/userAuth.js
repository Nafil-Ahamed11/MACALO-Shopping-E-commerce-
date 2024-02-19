const isLogin =  async (req,res,next) =>{
    try {

        if(req.session.user){
            next();
        }else{
            res.redirect('/login')
        }
        
    } catch (error) {
        console.log(error.message)
        
    }
}

const isLogout = async (req,res,next) => {
    try {
        if(req.session.user){
            res.redirect('/home')
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message);
        
    }
} 




module.exports = {
    isLogin,
    isLogout,
   
}