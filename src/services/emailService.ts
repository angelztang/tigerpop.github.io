// Email service using the backend FlaskMail service
import { API_URL } from '../config';
import axios from 'axios';

export interface EmailParams {
  recipientEmail: string;
  listingTitle: string;
  listingPrice: string;
  listingCategory: string;
  buyerNetid: string;
}

/**
 * Send an email notification using the backend API
 */
export const sendEmailNotification = async (params: EmailParams): Promise<boolean> => {
  try {
    console.log('Sending email with params:', params);
    
    // Convert EmailParams to the format expected by the backend
    const emailData = {
      to_email: params.recipientEmail,
      listing_title: params.listingTitle,
      listing_price: params.listingPrice,
      listing_category: params.listingCategory,
      buyer_netid: params.buyerNetid
    };

    // Call backend email endpoint
    const response = await axios.post(`${API_URL}/api/listing/email/send`, emailData);
    
    console.log('Email sent successfully via backend service:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to send email via backend service:', error);
    return false;
  }
}; 