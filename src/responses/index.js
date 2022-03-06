const { StatusCodes } = require("http-status-codes");

const successResponse = (res, data) => {
  res.status(StatusCodes.OK).json({ success: true, data });
};

const createdResponse = (res, data) => {
  res.status(StatusCodes.CREATED).json({ success: true, data });
};

const generalErrorResponse = (res, err) => {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, err });
};

const badRequestResponse = (res, err) => {
  res.status(StatusCodes.BAD_REQUEST).json({ success: false, err });
};

const notFoundResponse = (res, err) => {
  res.status(StatusCodes.NOT_FOUND).json({ success: false, err });
};

const unauthorizedResponse = (res, err) => {
  res.status(StatusCodes.UNAUTHORIZED).json({ success: false, err });
};

module.exports = {
  successResponse,
  createdResponse,
  generalErrorResponse,
  badRequestResponse,
  notFoundResponse,
  unauthorizedResponse,
};
