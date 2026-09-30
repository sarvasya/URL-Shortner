const crypto = require("crypto");

const BASE62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// 62^6 = ~56.8 billion possible codes
const generateShortCode = (length = 6) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += BASE62[crypto.randomInt(BASE62.length)];
  }
  return code;
};

module.exports = generateShortCode;
