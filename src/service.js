require('dotenv').config();
const apn = require('@parse/node-apn');

// APNs Provider Setup (shared)
const apnProvider = new apn.Provider({
  cert: process.env.PUSH_CERT_PATH,
  key: process.env.PUSH_KEY_PATH,
  passphrase: process.env.PUSH_PASSPHRASE,
  production: process.env.APN_PRODUCTION === 'true'
});

/**
 * Send APN notification to given device tokens.
 * @param {string[]} deviceTokens
 * @param {object} notificationPayload
 * @returns {Promise<object>} send result
 */
const sendNotification = async (deviceTokens, notificationPayload) => {
  const message = new apn.Notification();
  Object.assign(message, notificationPayload);
  console.log('sss',process.env.APN_BUNDLE_ID);
  message.topic = process.env.APN_BUNDLE_ID;
  return apnProvider.send(message, deviceTokens);
};

/**
 * Shutdown the APNs provider.
 */
const shutdownProvider = () => apnProvider.shutdown();

module.exports = {
  sendNotification,
  shutdownProvider
};