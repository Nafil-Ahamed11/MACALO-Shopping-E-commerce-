const isAdminLoigin = async (req,res,next) =>{
    try {
        if(req.session.admin){
            next();
        }else{
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error.message);
        
    }
}

const isAdminLogout = async (req,res,next) =>{
    try {
        if(req.session.admin){
            res.redirect('/');
        }else{
            next()
        }
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    isAdminLoigin,
    isAdminLogout,
   
}
