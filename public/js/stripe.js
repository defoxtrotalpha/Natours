import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(`${process.env.STRIPE_PUBLISHABLE_KEY}`);

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // 2) Create checkout form + charge credit card
    location.assign(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};