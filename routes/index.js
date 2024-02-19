var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");
const bodyParser = require('body-parser');

passport.use(new localStrategy(userModel.authenticate()));

router.use(bodyParser.json());

router.get('/', function(req, res) {
  res.render('index', {nav: false, error: req.flash("error")});
});

router.get("/register", function(req, res){
  res.render("register", {nav: false});
});

router.get("/profile", isLoggedIn, async function(req, res){
  const user = 
  await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts");

  res.render("profile", {user, nav: true});
});

router.get("/feed", isLoggedIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find()
  .populate("user");

  res.render("feed",{user, posts, nav: true});
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
    caption: req.body.caption,
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

router.post("/deleteprofile", isLoggedIn, async function(req, res) {
  try {
    // Find the user document based on the username
    const user = await userModel.findOne({ username: req.session.passport.user });

    if (!user) {
      // Handle case where the user is not found
      return res.status(404).send("User not found");
    }

    // Use the user's _id as the filter for postModel.deleteMany
    const filter = { user: user._id };

    // Use await with deleteMany since it returns a promise
    const postResult = await postModel.deleteMany(filter);

    console.log(`${postResult.deletedCount} documents in postModel deleted successfully`);

    // Use await with findByIdAndDelete since it returns a promise
    const userResult = await userModel.findByIdAndDelete(user._id);

    if (userResult) {
      console.log(`User document deleted successfully`);
    } else {
      console.log(`User document not found`);
    }

    res.redirect("/register"); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/editpost", isLoggedIn, async function(req, res){
  const postId = req.query.postId; // Access the postId parameter from the query
  req.flash("postId", postId);
  console.log(postId);
  res.render("editpost", { nav: true }); 
});

router.post("/updatepost", isLoggedIn, async function(req, res) {
  try {
    const postId = req.flash("postId"); // Retrieve flashed date
    const currentId = postId[postId.length-1];

    const post = await postModel.findOne({_id: currentId});
    post.caption = req.body.caption;
    await post.save();
    
    res.redirect("/profile");    
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/deletepost", isLoggedIn, async function(req, res){
  try {
    const postId = req.flash("postId"); // Retrieve flashed date
    const currentId = postId[postId.length-1];

    await postModel.findByIdAndDelete(currentId);
    const user = await userModel.findOne({ username: req.session.passport.user });
    user.posts.pull(currentId);
    await user.save();

    res.redirect("/profile");   
    
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/secretquestion", isLoggedIn, function(req, res){
  res.render("secretquestion",{nav: false});
});

router.post("/secretquestion", async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  user.secret = req.body.secret;
  await user.save();
  res.redirect("/profile");
});

router.get("/forgetpassword", async function(req, res){
  res.render("forgetpassword",{nav: false});
});

router.post("/forgetpassword", async function(req, res) {
  const data = await userModel.find({});
  let userExists = false;

  for (let i = 0; i < data.length; i++) {
    if (data[i].username === req.body.username) {
      userExists = true; // Set userExists to true if username exists in the database
      
      if (data[i].secret === req.body.secret) {
        // If username and secret match, redirect to resetpassword page
        req.flash("user",data[i].username);
        return res.redirect("/resetpassword");
      } else {
        console.log("Wrong answer");
        return res.status(400).send("Wrong answer"); // Respond with an error message
      }
    }
  }
  // If the loop completes and no matching username is found, respond accordingly
  if (!userExists) {
    console.log("User does not exist");
    return res.status(400).send("User does not exist");
  }
  
  // This line will only be reached if the loop does not redirect or respond
  // Redirect to /forgetpassword in case of any unexpected conditions
  res.redirect("/forgetpassword");
});

router.get("/resetpassword", function(req, res){
  res.render("resetpassword",{nav: false});
});

router.post("/resetpassword", async function(req, res){
  
  try {

    const data = await userModel.find({});
    const currentUser = req.flash("user");
    
    for(let i=0; i<data.length; i++){
      if(currentUser == data[i].username){
        if (req.body.password) {
          const user = data[i];
          await user.setPassword(req.body.password);
          await user.save();
          console.log("Password reset successfully");
          res.redirect("/profile");
        } else {
          console.error("New password not provided");
          res.status(400).send("New password not provided");
        }
      }
    }

    
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/getdata', async (req, res) => {
  try {
      // Fetch data from MongoDB
      const data = await postModel.find({});

      // Send data to the frontend
      res.json(data);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.post('/updatelikecount', isLoggedIn, async function(req, res) {
  try {
    // Extract postId and newLikeCount from the request body
    const { postId, newLikeCount, currentUser, value } = req.body;

    const post = await postModel.findOne({_id: postId});
    
    if (value === true) {
      // if(!(post.likedUsers.includes(currentUser))){
         // Update the like count for the post in the database
        await postModel.findByIdAndUpdate(postId, { likeCount: newLikeCount });
        post.likedUsers.push(currentUser);
        await post.save();
        req.flash("like", "fas");
      // } 
    } 
    
    else {
      // Remove currentUser from likedUsers array
      const index = post.likedUsers.indexOf(currentUser);
      if (index !== -1) {
         // Update the like count for the post in the database
        await postModel.findByIdAndUpdate(postId, { likeCount: newLikeCount });
        post.likedUsers.splice(index, 1);
        await post.save();
      }
    }
    
    console.log('Like count updated successfully for post:', postId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating like count:', error);
    res.status(500).json({ error: 'Failed to update like count' });
  }
});

router.get("/saved", isLoggedIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find()
  .populate("user");

  res.render("saved",{user, posts, nav: true});
});

router.get('/getuserdata', async (req, res) => {
  try {
      // Fetch data from MongoDB
      const user = await userModel.findOne({username: req.session.passport.user});
      
      // Send data to the frontend
      res.json(user);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.post('/updatesavepost', isLoggedIn, async function(req, res) {
  try {
    // Extract postId and newLikeCount from the request body
    const { postId, userId, value } = req.body;

    const user = await userModel.findOne({_id: userId});
    
    
    if (value === true) {
        user.savedPost.push(postId);
        await user.save();
    } 
    
    else {
      const index = user.savedPost.indexOf(postId);
      if (index !== -1) {
         // Update the like count for the post in the database
        user.savedPost.splice(index, 1);
        await user.save();
      }
    }

  } catch (error) {
    console.error(error);
  }
});

router.post("/register", async function(req, res){
  try {
    // Check if username already exists
    const existingUsername = await userModel.findOne({ username: req.body.username });
    if (existingUsername) {
      return res.status(400).send('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await userModel.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).send('Email already exists');
    }

    // If both username and email are unique, proceed with registration
    const data = new userModel({
      username: req.body.username,
      fullname: req.body.fullname,
      email: req.body.email,
    });

    await userModel.register(data, req.body.password);
    
    passport.authenticate("local")(req, res, function(){
      res.redirect("/secretquestion");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred during registration');
  }
});

router.post("/login", passport.authenticate("local", {
  failureRedirect: "/",
  failureFlash: true
}), async function(req, res) {

  // Get the username from the request parameters
  const user = await userModel.findOne({ username: req.body.username });

  if (!user.secret) {
    res.redirect("/secretquestion");
  } else {
    res.redirect("/profile");
  }
  
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
