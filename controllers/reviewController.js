import Review from './../models/reviewModel.js';
import catchAsync from './../utils/catchAsync.js';
import factory from './handlerFactory.js';

const setTourUserIds = (req, res, next) => {
  //Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  //Protect middleware will put user on req
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

const getAllReviews = factory.getAll(Review);
const addReview = factory.addOne(Review);
const deleteReview = factory.deleteOne(Review);
const updateReview = factory.updateOne(Review);
const getReview = factory.getOne(Review);

export {
  getAllReviews,
  addReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
};
