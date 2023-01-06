import express from 'express'
import {getOverview, getLogin, getTour, getSignUp, getAccount, getMyTours} from '../controllers/viewsController.js'
import {isLoggedIn, protect} from '../controllers/authController.js'

const router = express.Router();

//router.use(viewsController.alerts);

router.get('/', isLoggedIn, getOverview);

router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/signup', isLoggedIn, getSignUp);
router.get('/login', isLoggedIn, getLogin);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);

//router.get('/my-tours', protect, getMyTours);

//router.post('/submit-user-data', protect, updateUserData);

export default router;