import mongoose from 'mongoose';
import slugify from 'slugify';
// import User from './userModel.js';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: Easy, Medium or Difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be greater than 1'],
      max: [5, 'Ratings must be less than 5'],
      set: (val) => Math.round(val * 10) / 10, //Math.round only rounds to integers
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a rating'],
    },
    priceDiscount: {
      type: Number,
      //CUSTOM VALIDATOR
      validate: {
        validator: function (val) {
          //this only points to current doc on NEW doc creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startLocation: {
      //Geo JSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    startDates: [Date],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//Embedding guides in Tour document
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//QUERY MIDDLEWARE: runs before .find() query
//tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  //this will be the query object
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v',
  });
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  //this will be the query object
  console.log(`Query took ${Date.now() - this.start} ms`);
  this.start = Date.now();
  next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   //console.log(this.pipeline());
//   //unshift is used to add data in the start of array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

//Using function expression instead of arrow func cuz arrow func does not have this keyword
//Virtual variables are not stored in DB
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

const Tour = mongoose.model('Tour', tourSchema);
export default Tour;

////////////////////////////////////////////////////////////////////////////////
// import mongoose from "mongoose";
// const tourSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "A tour must have a name"],
//       unique: true,
//       trim: true,
//       maxlength: [40, "A tour name must have less than 40 characters"],
//       minlength: [10, "A tour name must have more than 10 characters"],
//     },
//     duration: {
//       type: Number,
//       required: [true, "A tour must have a duration"],
//     },
//     maxGroupSize: {
//       type: Number,
//       required: [true, "A tour must have a group size"],
//     },
//     difficulty: {
//       type: String,
//       required: [true, "A tour must have a difficulty"],
//       enum: {
//         values: ["easy", "medium", "difficult"],
//         message: "Difficulty has to be easy, medium or difficult",
//       },
//     },
//     ratingsAverage: {
//       type: Number,
//       default: 4.5,
//       min: [1, "Rating must be above 1.0"],
//       max: [5, "rating must be under 5.0"],
//     },
//     ratingsQuantity: { type: Number, default: 0 },
//     price: { type: Number, required: [true, "A tour must have a price"] },
//     priceDiscount: {
//       type: Number,
//       /*custom validator to check if discount is lower than actual price*/
//       validate: function (val) {
//         return val < this.price;
//       },
//       message: "Discount price ({VALUE}) should be below regular price",
//     },
//     summary: {
//       type: String,
//       trim: true,
//       required: [true, "A tour must have a description"],
//     },
//     description: {
//       type: String,
//       trim: true,
//     },
//     imageCover: {
//       type: String,
//       required: [true, "A tour must have a cover image"],
//     },
//     images: [String],
//     createdAt: {
//       type: Date,
//       default: Date.now(),
//       select: false,
//     },
//     startDates: [Date],
//   },
//   {
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// tourSchema.virtual("durationWeeks").get(function () {
//   return this.duration / 7;
// });
// export const Tour = mongoose.model("Tour", tourSchema);
/////////////////////////////////////////////////////////////
