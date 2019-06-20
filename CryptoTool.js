/****************************************************************************************************
 * CryptoTools.js
 * Tool for encrypting / decrypting paddlers information
 ****************************************************************************************************/

const crypto = require('crypto');
const algorithm = '';
const password = '';

/****************************************************************************************************
 * Encrypt
 ****************************************************************************************************/
function encrypt(text) {
  var cipher = crypto.createCipher(algorithm, password)
  var crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');

  return crypted;
}

/****************************************************************************************************
 * Decrypt
 ****************************************************************************************************/
function decrypt(text) {
  var decipher = crypto.createDecipher(algorithm, password)
  var dec = decipher.update(text, 'hex', 'utf8')
  dec += decipher.final('utf8');

  return dec;
}

/****************************************************************************************************
 * Array of paddler's info
 ****************************************************************************************************/
var paddlers = 
[
  ''
]; 

paddlers.forEach(function (paddler) {
  console.log(encrypt(paddler));
  // console.log(decrypt(paddler));
});
