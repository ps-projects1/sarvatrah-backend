const login = require("./login");
const register = require("./register");
const addUser = require("./addUser");
const forgotPassword = require("./forgotPassword");
const verifyOtp = require("./verifyOtp");
const changePassword = require("./changePassword");
const logout = require('./logout');
const resendOtp = require('./resendOtp');

module.exports = {
  login: login,
  register: register,
  addUser: addUser,
  forgotPassword: forgotPassword,
  verifyOtp: verifyOtp,
  changePassword: changePassword,
  logout : logout,
  resendOtp : resendOtp
};
