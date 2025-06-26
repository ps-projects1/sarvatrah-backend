const generateResponse = (status, message, data = null) => {
  const errorResponse = {
    status: status,
    message: message,
    data: data,
  };
  return errorResponse;
};

const generateErrorResponse = (message = "", error = null) => {
  return {
    status: false,
    message: message,
    error: error,
  };
};

module.exports = {
  generateErrorResponse,
  generateResponse,
};
