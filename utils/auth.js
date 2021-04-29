const jwt = require('jsonwebtoken');
require('dotenv').config();

//middleware to verify token on request.
const verifyToken = (req, res, next) => {
  const token = req.header('auth_token');
  console.log('Verify token found header of: ',token);

  if(!token || undefined) return res.status(401).json({error : "Access denied"});

  try {
    const verified = jwt.verify(token, process.env.TOKEN_KEY);
    req.user = verified;
    next();

  } catch (error) {
    console.log('Verify token error: ', error);
    res.status(400).json({error : "Invalid token"});
  }
}

function createToken (name, u_id) {
  const token = jwt.sign({
    name, 
    id : u_id
  }, process.env.TOKEN_KEY);

  return token;
};

module.exports = {
  createToken,
  verifyToken
};