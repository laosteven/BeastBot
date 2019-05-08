import { createCipher, createDecipher } from 'crypto';
var algorithm = '';
var password = '';

function encrypt(text) {
  var cipher = createCipher(algorithm, password)
  var crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text) {
  var decipher = createDecipher(algorithm, password)
  var dec = decipher.update(text, 'hex', 'utf8')
  dec += decipher.final('utf8');
  return dec;
}

var misc = 
[
  
]; 

misc.forEach(function (item) {
  var enc = encrypt(item);
  console.log(enc);
  // console.log(decrypt(enc));
});
