const { generalErrorResponse, badRequestResponse } = require("../responses");

const errorHandler = (err, req, res, next) => {
  console.log(err);
  if (err.name === "ValidationError") {
    const errorObject = {};
    Object.values(err.errors).map(
      (error) => (errorObject[error.path] = error.message)
    );
    return badRequestResponse(res, errorObject);
  }
  if (err.code === 11000) {
    const errorObject = {};
    Object.keys(err.keyPattern).map((error) => {
      errorObject[error] = `${
        error[0].toUpperCase() + error.slice(1)
      } already exists`;
    });
    return badRequestResponse(res, errorObject);
  }
  generalErrorResponse(res, err);
};

module.exports = errorHandler;
