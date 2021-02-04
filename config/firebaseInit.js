const admin = require('firebase-admin');
const credentials = require('../cred/pwa-tutorial-d548f-cred.json');
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

module.exports = admin.messaging();