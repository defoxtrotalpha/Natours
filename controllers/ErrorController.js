import AppError from '../utils/AppError.js';

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = (err) =>
  new AppError('Your token has expired!. Please log in again!', 401);

export default (err, req, res, next) => {
  //console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err,req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);

    sendErrorProd(error,req, res);
  }
};

const sendErrorDev = (err,req, res) => {
  //A) API
  if(req.originalUrl.startsWith('/api')){
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  //B) RENDERED WEBSITE
  console.error('ERROR', err)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err,req, res) => {
  //A) API
  if(req.originalUrl.startsWith('/api')){
    //1) Operational, trusted error: Send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
  };
  //2) Programming or unknown error: don't leak error information
    // i) Log error
    console.error('ERROR', err);
    // ii) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  //B) RENDERED WEBSITE
    //1) Operational, trusted error: Send message to client
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error',{
      title: 'Something went very wrong!',
      msg: err.message,
    });
  }

    //2) Programming or unknown error: don't leak error information
  console.error('ERROR', err);
  return res.status(err.statusCode).render('error',{
    title: 'Something went very wrong!',
    msg: 'Please try again later.',
  });
}