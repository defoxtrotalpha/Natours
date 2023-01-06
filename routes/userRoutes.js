import express from 'express';
import multer from 'multer';

const router = express.Router();
import {
  getAllUsers,
  addUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto
} from '../controllers/userController.js';

import {
  signUp,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updateMyPassword,
  restrictTo,
  logout
} from './../controllers/authController.js';

const upload = multer({ dest: 'public/img/users' });

router.post('/signup', signUp);
router.post('/login', login);
router.get('/logout',logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

//Protect all routes after this middleware
router.use(protect);

router.patch('/updateMyPassword', protect, updateMyPassword);
router.patch('/updateMe', protect,uploadUserPhoto,resizeUserPhoto, updateMe);
router.delete('/deleteMe', protect, deleteMe);

router.use(restrictTo('admin'));

router.get('/me', protect, getMe, getUser);
router.route('/').get(getAllUsers).post(addUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default router;
