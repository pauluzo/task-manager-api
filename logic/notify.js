const messaging = require('../config/firebaseInit');

const clientNotification = async (token, payload, options = {priority: 'high'}) => {
  let returnValue = {};
  messaging.sendToDevice(token, payload, options)
  .then(response => {
    console.log('message sent successfully: ', response);
    returnValue = {success: response};
  })
  .catch(error => {
    console.log('message sending error: ', error);
    returnValue = {error: error};
  });
  return returnValue;
}

module.exports = clientNotification;