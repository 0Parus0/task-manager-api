const jwt = require('jsonwebtoken');
const User = require('../modals/user');

const auth = async(req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({_id: decoded._id, 'tokens.token': token });

    if(!user){
     return res.status(401).send({error: 'Please authenticate'}); 
    }

    req.token = token
    req.user = user;
    next()

  } catch (error) {
   
  }
}

module.exports = auth;