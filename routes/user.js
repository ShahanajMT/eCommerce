var express = require('express');
const { response } = require('../app');
var router = express.Router();
const productHelper = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const verifyLogin = (req,res,next) =>{
  if(req.session.loggedIn) {
    next()
  }else {
    res.redirect('/login')
  }
}



/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user
  console.log(user);
  let cartCount = null
  if(req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)

  }
  productHelper.getAllProducts().then((products) => {
    // console.log(products);
    res.render('user/view-products',{products, user, cartCount})
  })
  //res.render('index', { products,admin:false });
});
router.get('/login',(req, res) => {
  if(req.session.loggedIn){
    //console.log("Go to home page");
    res.redirect('/')
  }
  else {
    res.render('user/login',{"loginErr":req.session.loginErr})
    //console.log("...");
    req.session.loginErr  = false
  }
})


router.get('/signup',(req, res) => {
  res.render('user/signup')
})

router.post('/signup',(req,res) => {
  userHelpers.doSignup(req.body).then((response)=> {
    console.log(response);
  })
})

router.post('/login',(req, res)=> {
   userHelpers.doLogin(req.body).then((response)=> {
    if(response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/') 
    }
    else {
      req.session.loginErr = true 
      res.redirect('/login')
    }
   })
})

router.get('/logout',(req,res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin, async(req,res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  console.log(products);
  let user = req.session.user._id
  console.log(user);
  // console.log('########'+req.session.user._id);
   res.render('user/cart',{products, user, totalValue})
})

router.get('/add-to-cart/:id', (req, res) => {
  console.log("API Calls");
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({status:true })
    //res.redirect('/')  
  })
})

router.post('/change-product-quantity',(req, res,next) => {
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async(response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user) 
    res.json(response)
    //console.log(req.body);
  })
})

router.get('/place-orders', verifyLogin,async(req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render("user/place-orders",{total,user:req.session.user})
})

router.post('/place-orders', async(req,res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice =  await userHelpers.getTotalAmount(req.body.userId)

  userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
    res.json({status:true})
  })
  console.log(req.body);  
})



module.exports = router;
