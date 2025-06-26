const generatePassword = () => {
  let txt = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  let password = "";
  const passwordLength = 8; // Define the desired length of the password

  for (let i = 0; i < passwordLength; i++) {
    password += txt.charAt(Math.floor(Math.random() * txt.length));
  }
  return password;
};

module.exports = generatePassword;
