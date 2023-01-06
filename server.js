import mongoose from 'mongoose';
import dotenv from 'dotenv';

process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('Unhandled Exception. Shutting down...');
  process.exit(1);
});

import app from './app.js';

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<DATABASE_PASS>',
  process.env.DATABASE_PASS
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful');
  });

// console.log(process.env);
// const testTour = new Tour({
//   name: 'The Forest Hiker',
//   price: 497,
// });

// testTour
//   .save()
//   .then((doc) => console.log(doc))
//   .catch((err) => console.log(err));

//START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('Listening at port 3000');
});

//HANDLING UNHANDLED REJEJECTIONS
process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('Unhandled Rejection. Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', (err) => {
  console.log('SIGTERM Received. Shutting down...');
});