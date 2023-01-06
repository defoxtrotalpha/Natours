import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import APIfeautures from '../utils/APIFeatures.js';

const deleteOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

const updateOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

const addOne = (Model) =>
  catchAsync(async (req, res) => {
    // const newTour = new Tour({});
    // newTour.save();
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

const getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //req.query is an Object with query values from url\

    //To allow for Nested GET reviews on tour
    //GET /tours/676sd7asdwq76/reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //EXECUTE QUERY
    const features = new APIfeautures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    //const docs = await features.query.explain();
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: docs,
    });
  });

const getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

export default { deleteOne, updateOne, addOne, getAll, getOne };

//   const deleteTour = catchAsync(async (req, res) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//       return next(new AppError('No tour found with ID', 404));
//     }

//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
//   });
