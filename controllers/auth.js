const bcrypt = require("bcryptjs") // for password encryption
const User = require('../models/user')
const nodemailer = require("nodemailer");
const crypto = require('crypto') //built in library to generate token for resseting password


const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: "seyimarv09@outlook.com",
    pass: "Tomilayo1!"
  }
}) //for sending emails

exports.getLogin = (req, res, next) => {
  // const isLoggedIn = req.get("Cookie").split('=')[1] 
  // getting the loggedin info from the request i.e extracting the cookie
   let message = req.flash("error")
   if (message.length > 0) {
     message = message[0];
   } else {
     message = null;
   }
  res.render("auth/login", {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message // pulled only if error flashed into sesion
  })

}


exports.getSignup = (req, res, next) => {
  let message = req.flash("error")
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: message
  });
};


exports.getReset = (req, res, next) => {
  let message = req.flash("error")
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    isAuthenticated: false,
    errorMessage: message
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token; //get the token from the url param

  User.findOne(
    {resetToken: token, resetTokenExpiration: {$gt: Date.now()}}
  ).then(user => {
    let message = req.flash("error")
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    res.render('auth/newpassword', {
        path: '/newpassword',
        pageTitle: 'New Password',
        isAuthenticated: false,
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
  
    })

  }).catch(err => {
    console.log(err)
  })

}

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email}).then(user => {
   if (!user) {
     req.flash('error', 'Invalid email or password.'); // saves it in the session
     return res.redirect('/login')
   } //if the user email doesnt exist. 
   // check if the password is correct
    bcrypt.compare(password, user.password).then(doMatch => {
      if(doMatch) {
        req.session.isLoggedIn = true;
        req.session.user = user;
       return req.session.save((err) => {
         console.log(err)
        res.redirect('/')
        }) //makes sure the session is created before redirection
      } //if the password is correct
      req.flash('error', 'Invalid email or password.'); 
      res.redirect('/login') // if user doesnt exist
    }).catch(err => {
      console.log(err)
      res.redirect('/login')
    })
  }).
    catch(err => console.log(err))
 
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email }).then(userDoc => {
    if (userDoc) {
      req.flash('error', 'E-mail already exist', 'please pick another email')
      return res.redirect('/signup')
    }   // check if user email already exist
    //if not create a new user
    if (password !== confirmPassword) {
       req.flash('error', 'passwords do not match with confirm password')
       return res.redirect('/signup')
    }
    return bcrypt.hash(password, 12).then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] }
      })
      return user.save()

    }).then(result => {
      res.redirect('/login')
    return  transporter.sendMail({
        to: email,
        from: "seyimarv09@outlook.com",
        subject: "Signup suceeded",
        html: "<h1>you sucessfully signed up!</h1>"
      })
    }).catch(err => {
      console.log(err)
    })
  }).catch(err => {
    console.log(err)
  })
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  }); // provided to allow delete the project session
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err)
      return res.redirect('/reset')
    }
    const token = buffer.toString('hex') //use the buffer to generate a sting
    User.findOne({email: req.body.email}).then(user => {
      if (!user) {
        req.flash('error', 'No account with that email found')
        return res.redirect('/reset')
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
     return user.save()
    }).then(result => {
      res.redirect('/')
     transporter.sendMail({
        to: req.body.email,
        from: "seyimarv09@outlook.com",
        subject: "Reset password",
        html: `
        <p>You requested a password reset</p>
        <p>click this <a href="http://localhost:3000/reset/${token}">Link</a> to set a new password. </p>
        `
      }) //sends the reset password email to the user
    }).catch(err => {
      console.log(err)
    }) //find the user
  })

}

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password
  const confirmPassword = req.body.confirmPassword
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  console.log(passwordToken)
  let resetUser;

  User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id:userId}).then(user => {
    resetUser = user;
     if(newPassword !== confirmPassword) {
        req.flash('error', "passwords dont match")
        return res.redirect(`/reset/${passwordToken}`)
     } 
     return bcrypt.hash(newPassword, 12)
  }).then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save()
    

  }).then(result => {
    res.redirect('/login');
  }).catch(err => {
    console.log(err)
  })
}