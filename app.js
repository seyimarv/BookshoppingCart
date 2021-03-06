const path = require('path');

const User = require('./models/user')

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require("mongoose") 
const session = require("express-session") //importing the sessions from express
const MongoDbStore = require("connect-mongodb-session")(session)
const csrf = require('csurf') // to protect your app. check jottings to understand
const errorController = require('./controllers/error');
const useFlash  = require('connect-flash')
const multer = require('multer') // for file uploads

const MONGODB_URI = 'mongodb+srv://Marvelous:Tomilayo1@cluster0.yopfs.mongodb.net/myFirstDatabase'

const store = new MongoDbStore({
    uri: MONGODB_URI, 
    collection: 'sessions',

}); //set up the store

const crsfProtection = csrf(); 
const flash = useFlash()

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    }

})

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true); //if we want to store the data
    } else {
        cb(null, false); //if we dont want to store the data
    }

    
}; //a function that determines the kind of object to be accepted

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require("./routes/auth");



app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image')) //middleware for file upload, 'image' corresponds to the name of the input. single means it has to do with only one file
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static( path.join(__dirname, 'images'))); // stactically serving the images folder.
app.use(session({secret: "my secret", resave: false, saveUninitialized: false, store: store })) //initializing the session middleware
app.use(crsfProtection) // needs to be added after session have been created.
app.use(flash) // needs to be caled after session have been created

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next()
}) //tells express to include theses datas in all rendered page. Locals field allow to set local variable that are passed into the views

app.use((req, res, next) => {
    if (!req.session.user) {
        return next() //if there is no user
    }
 User.findById(req.session.user._id).then(user => {
    if(!user) {
        return next()
    } //incase something happened to the user, like deleted or something.
        req.user = user; //makes sure yiu get acess to the real mongoose onbject which has all the methods. the one gotten from the mongoose session storage wont work,
        next()
    }).
    catch(err => {
        next(new Error(err));
    })
})



app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get( '/500', errorController.get500)
app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'ERROR OCCURED!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    
      })
}) // the special error handling middleware

mongoose.connect(MONGODB_URI)
.then(result => {
    // User.findOne().then(user => {
    //     if (!user) {
    //         const user = new User({
    //             name: "marvelous",
    //             email: "oluwaseyitan299@gmail.com",
    //             cart: {
    //                 items: []
    //             }
    //         })
    //         user.save()
    //     }
    // }) //for creating dummy user
   
    app.listen(3000)

}).catch(err => {
    console.log(err)
})


