const express = require("express");
const cors = require("cors");
const ejs = require("ejs");
const app = express();

require("./config/database");
require("dotenv").config();
require("./config/pasport");


const User = require("./models/user.model");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const passport = require("passport");
const session = require("express-session");
const MongoStore = require('connect-mongo');


app.set("view engine", "ejs"); 
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.set('trust proxy', 1); // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    collectionName: "sessions",
  }),
  //cookie: { secure: true }
 })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Base URL
app.get("/", (req, res) => {
res.render("index");
});

// register : get Route
app.get("/register", (req, res) => {
    res.render("register");
});

// register : post Route
app.post("/register", async(req, res) => {
    try {
        const user = await User.findOne({
            username: req.body.username
        });
        if(user) return res.status(400).send("user already exits");
        
        bcrypt.hash(req.body.password, saltRounds, async(err, hash) => {
            const newUser = new User({
                username: req.body.username,
                password: hash
            });
            await newUser.save();
            res.status(201).redirect("/login");
        });

    } catch (error) {
        res.status(500).send(error.message);
    }
});

const checkLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
      return res.redirect("/profile");
    }
    next();
  };

// login : get Route
app.get("/login", checkLoggedIn, (req, res) => {
    res.render("login");
});

// login : post Route
// app.post("/login", (req, res) => {
//     try {
//         res.status(201).send("user is logged in");
//     } catch (error) {
//         res.status(500).send(error.message);
//     }
// });

app.post("/login", 
   passport.authenticate('local', { 
    failureRedirect: '/login',
    successRedirect: "/profile", 
 })
);
  


const checkAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
};


// Profile protected Route
app.get("/profile", checkAuthenticated, (req, res) => {
    // if(req.isAuthenticated()){
    //     res.render("profile");
    // }
    // res.redirect("/login");
  res.render("profile");

});

// logout : Route
app.get("/logout", (req, res) => {
    try {
     req.logout((err)=>{
     if(err){
        return next(err);
     }
     res.redirect("/");
    })
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = app;