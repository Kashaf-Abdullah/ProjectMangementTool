import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCreditCard, FiLock, FiArrowLeft } from 'react-icons/fi';
import '../../styles/pages/billing.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const { data: { clientSecret } } = await api.post('/billing/create-payment-intent', {
        amount: 500, // $5.00
        currency: 'usd'
      });

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            // Add billing details here if needed
          }
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        toast.error(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful! Your user limit has been increased.');
        navigate('/billing');
      }
    } catch (error) {
      setError('Payment failed. Please try again.');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-header">
        <h2>Add User Pack</h2>
        <p className="checkout-subtitle">
          Get 5 additional user slots for your team
        </p>
      </div>

      <div className="checkout-summary">
        <div className="summary-item">
          <span>User Pack (5 users)</span>
          <span>$5.00</span>
        </div>
        <div className="summary-item total">
          <span>Total</span>
          <span>$5.00</span>
        </div>
      </div>

      <div className="payment-section">
        <h3>
          <FiCreditCard />
          Payment Details
        </h3>
        
        <div className="card-input">
          <CardElement options={cardElementOptions} />
        </div>
        
        <div className="payment-info">
          <FiLock size={14} />
          <span>Your payment is secure and encrypted</span>
        </div>
      </div>

      {error && (
        <div className="payment-error">
          {error}
        </div>
      )}

      <div className="checkout-actions">
        <button
          type="button"
          className="btn secondary-btn"
          onClick={onCancel}
          disabled={loading}
        >
          <FiArrowLeft />
          Cancel
        </button>
        <button
          type="submit"
          className="btn primary-btn"
          disabled={!stripe || loading}
        >
          {loading ? 'Processing...' : 'Pay $5.00'}
        </button>
      </div>
    </form>
  );
};

const Checkout = ({ onCancel }) => {
  return (
    <div className="checkout-container">
      <div className="checkout-card">
        <Elements stripe={stripePromise}>
          <CheckoutForm onCancel={onCancel} />
        </Elements>
      </div>
    </div>
  );
};

export default Checkout;