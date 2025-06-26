function otpGenerator() {
  let random = Math.floor(100000 + Math.random() * 900000);
  return random;
}

module.exports = otpGenerator;
