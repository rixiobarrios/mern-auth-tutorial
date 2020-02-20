const express = require('express');
const bcrypt = require('bcrypt');
const { createUserToken } = require('../middleware/auth');

const User = require('../db/models/user_model');

const router = express.Router();

// SIGN UP
// POST /api/signup
//Using promise chain
router.post('/signup', (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
    // return a new object with the email and hashed password
    .then(hash =>
      // when returning an object with fat arrow syntax, we
      // need to wrap the object in parentheses so JS doesn't
      // read the object curly braces as the function block
      ({
        email: req.body.email,
        password: hash
      })
    )
    // create user with provided email and hashed password
    .then(user => User.create(user))
    // send the new user object back with status 201, but `hashedPassword`
    // won't be send because of the `transform` in the User model
    .then(user => res.status(201).json(user))
    // pass any errors along to the error handler
    .catch(next);
});

// SIGN IN
// POST /api/signin
router.post('/signin', (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => createUserToken(req, user))
    .then(token => res.json({ token }))
    .catch(next);
});

// SIGN OUT
// DELETE /api/signout
router.post('/signout', (req, res, next) => {
  req.json({ token: '' });
});

module.exports = router;
