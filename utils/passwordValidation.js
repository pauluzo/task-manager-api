const cryptex = require('crypto');

function generatePassword (password) {
  let salt = cryptex.randomBytes(32).toString('hex');
  let hash = cryptex.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

  return {
    salt,
    hash
  }
}

function validatePassword (password, hash, salt) {
  let hashVerify = cryptex.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashVerify
}

module.exports = {
  generatePassword,
  validatePassword
};