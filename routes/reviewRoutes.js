import express from 'express';
import {
  getAllReviews,
  addReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} from '../controllers/ReviewController.js';
import { protect, restrictTo } from '../controllers/authController.js';

//Merger params will take all params on all routes
const router = express.Router({ mergeParams: true });
//POST /tour/2345cft/reviews

router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), setTourUserIds, addReview);

router
  .route('/:id')
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .get(getReview);

export default router;
