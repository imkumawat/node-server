exports.passwordValidation = (password) => {
  if (password.length < 8 || password.length > 20) {
    return false;
  }
  const atleastOneCapitalRegex = /[A-Z]{1}/;
  if (!atleastOneCapitalRegex.test(password)) {
    return false;
  }

  const supportedSymbols = "!@#$%^&*()<>?".split("");
  const containsSymbol = password
    .split("")
    .some((p) => supportedSymbols.includes(p));
  if (!containsSymbol) {
    return false;
  }
  return true;
};
