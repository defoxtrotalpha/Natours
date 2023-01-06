import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import { promisify } from 'util';
import Email from '../utils/email.js';
import crypto from 'crypto';
import Mail from 'nodemailer/lib/mailer/index.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //Remove password
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
  });
};

const signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    // passwordChangedAt: req.body.passwordChangedAt,
    // role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  //Logging in means signing in json web token and sending it back to client
  createSendToken(newUser, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  //2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  //3) If everything OK, send token to client
  createSendToken(user, 200, res);
});

const logout=(req, res)=>{
  res.cookie('jwt','loggedout',{
    expires: new Date(Date.now()+ 10*1000),
    httpOnly: true,
  });

  res.status(200).json({
    status:'success',
  });
}

const protect = catchAsync(async (req, res, next) => {
  let token;
  //1) Getting token and checking if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt){
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please Log in to access!', 401)
    );
  }

  //2) Verification token
  //using promisify makes jwt.verify() returns a promise
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The User belonging to this token does no longer exist.',
        401
      )
    );
  }

  //4) Check if user changed password after token was issued
  if (currentUser.changesPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//AUTHORIZATION
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles=[admin, lead-guide]. role=user
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};



const isLoggedIn = async (req, res, next)=>{
  try{
    if(req.cookies.jwt){
      //1) Verify token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
  
      //2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if(!currentUser){
        return next();
      }
  
      //3) Check if user changed password after token was issued
      if (currentUser.changesPasswordAfter(decoded.iat)){
        return next();
      }
  
      //4) There is a logged in user. This user will be available on the pug file
      res.locals.user = currentUser;
      return next();
    }
  }catch(err){
    return next();
  }
  next();
};

const forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  //Saving because database entry was modified
  await user.save({ validateBeforeSave: false });

  //3) Sending token to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token has been sent to your email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    //Saving because database entry was modified
    await user.save({ validateBeforeSave: false });
    console.log(err);

    return next(
      new AppError('There was an error sending the email! Try again later'),
      500
    );
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) If token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update changePasswordAt property for the user (Happens in model)
  //4) Log the user in, send jwt
  createSendToken(user, 200, res);
});

const updateMyPassword = catchAsync(async (req, res, next) => {
  //1) Get user from the collection (Using find by id cuz user is already logged in)
  const user = await User.findById(req.user.id).select('+password');

  //2) Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  //3) If not, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //user.findByIdAndUpdate will NOT work here as it does not check for the validators again
  await user.save();

  //4) Log user in, send JWT
  createSendToken(user, 200, res);
});

export {
  login,
  logout,
  signUp,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updateMyPassword,
  isLoggedIn
};
