module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login')
    }
    next() // so the next middleware in line would be called.
} // middleware to protect routes, so only validated users should be able to access