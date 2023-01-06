import multer from 'multer';
import sharp from 'sharp';

import User from './../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import factory from './handlerFactory.js';

//Saving file to disk
// const multerStorage=multer.diskStorage({
//   destination: (req, file, cb)=>{ 
//     cb(null, 'public/img/users')
//   },
//   filename:(req, file, cb)=>{ 
//     const ext = file.mimetype.split('/')[1];
//     cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

//Saving file to temp memory
const multerStorage= multer.memoryStorage();

const multerFileFilter =(req, file, cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload only images', 400), false)
  }
};

const upload= multer({
  storage: multerStorage,
  fileFilter: multerFileFilter,
});

const uploadUserPhoto = upload.single('photo');

const resizeUserPhoto = catchAsync(async (req, res, next)=>{
  if(!req.file) return next();

  req.file.filename= `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality:90}).toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((element) => {
    if (allowedFields.includes(element)) newObj[element] = obj[element];
  });

  return newObj;
};

const updateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user posts password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );

  //2) Filter out unwanted fields that should not be updated here
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  //3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const addUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use Sign up.',
  });
};

const getUser = factory.getOne(User);
const updateUser = factory.updateOne(User);
const getAllUsers = factory.getAll(User);
const deleteUser = factory.deleteOne(User);

export {
  getAllUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto
};
