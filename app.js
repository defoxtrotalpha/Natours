import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import viewRouter from './routes/viewRoutes.js';
import globalErrorHandler from './controllers/ErrorController.js';
import AppError from './utils/AppError.js';

const app = express();

app.set('view engine', 'pug');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('views', path.join(__dirname, 'views'));

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// 1) Global MIDDLEWARES
//Set security HTTP headers
//app.use(helmet());
app.use(cors());

app.use(
  helmet({
    contentSecurityPolicy:false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(function(req, res, next) { 
    res.setHeader( 'Content-Security-Policy', "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com api.mapbox.com blob:"); 
    return next(); 
  });


//Body parser, Reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended:true, limit:'10kb' }));
app.use(cookieParser());

//Adding custom middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit reqs from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour',
});
app.use('/api', limiter);

// Data sanitization against noSQL query injection
app.use(mongoSanitize());

// Data sanitization against cross site scripting
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use('/', viewRouter);

// Mounting Router on route '/api/v1/tours'
app.use('/api/v1/tours', tourRouter);

//Mounting router on '/api/v1/users'
app.use('/api/v1/users', userRouter);

app.use('/api/v1/reviews', reviewRouter);

app.use('/api/v1/bookings', bookingRouter);

//Handling unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;