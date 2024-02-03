var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");


passport.use(new localStrategy(userModel.authenticate()));


router.get('/', function(req, res) {
  res.render('index', {nav: false});
});


router.get("/register", function(req, res){
  res.render("register", {nav: false});
});


router.get("/profile", isLoggedIn, async function(req, res){
  const user = 
  await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts")
  res.render("profile", {user, nav: true});
});


router.post("/fileupload", isLoggedIn, upload.single("image"), async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
});


router.get("/add", isLoggedIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("add", {user, nav: true});
});

router.post("/createpost", isLoggedIn, upload.single("postimage"), async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});


router.get("/edit", isLoggedIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("edit", {user, nav: true});
});

router.post("/updateprofile", isLoggedIn, async function(req, res) {
  try {
    const filter = { username: req.session.passport.user };

    const user = await userModel.findOne(filter);

    if (!user) {
      console.error("User not found");
      res.status(404).send("User not found");
      return;
    }

    if (req.body.password) {
      // If a new password is provided, use setPassword to hash and salt it
      await user.setPassword(req.body.password);

      // Update other profile information
      user.fullname = req.body.fullname;
      user.username = req.body.username;

      // Save the user with the updated information
      await user.save();

      console.log("Profile updated successfully");
      res.redirect("/profile");
    } else {
      // If no new password provided, update the user without changing the password
      user.fullname = req.body.fullname;
      user.username = req.body.username;

      // Save the user with the updated information
      await user.save();

      console.log("Profile updated successfully");
      res.redirect("/profile");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


router.get("/feed", isLoggedIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find()
  .populate("user")
  res.render("feed",{user, posts, nav: true});
});


router.post("/register", function(req, res){
  const data = new userModel({
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
  });

  userModel.register(data, req.body.password)
  .then(function(){
    passport.authenticate("local")(req, res, function(){
      res.redirect("/profile");
    })
  })
});

router.post("/login", passport.authenticate("local",{
  successRedirect: "/profile",
  failureRedirect: "/"
}), function(req, res){  
});

router.get("/logout", function(req, res, next){
  req.logout(function(err){
    if(err) { return next(err); }
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next){
  if(req. isAuthenticated()){
    return next();
  }
  res.redirect("/")
}

module.exports = router;
