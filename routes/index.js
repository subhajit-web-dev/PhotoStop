var express = require('express');
var router = express.Router();
const userModel = require("./users");


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.get("/register", function(req, res){
  res.render("register");
});



router.post("/register", function(req, res){
  const data = new userModel({
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
  })

  userModel.register(data, req.body.password)
  .then(function(){
    passport.authnticate("local")(req, res, function(){
      res.redirect("/profile");
    })
  })
});


module.exports = router;
