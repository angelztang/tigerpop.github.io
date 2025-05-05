// Email service using only EmailJS since backend email endpoints are not accessible
import emailjs from '@emailjs/browser';

// Your EmailJS credentials
const SERVICE_ID = 'service_ticjydc';
const TEMPLATE_ID = 'template_u8ipqhk';
const USER_ID = '2ixNYX1tKdtDNR0EK';

/**
 * Initialize EmailJS with your user ID
 * Call this function when your app starts
 */
export const initEmailJS = (): void => {
  emailjs.init(USER_ID);
};

// Initialize EmailJS immediately
initEmailJS();
console.log("EmailJS initialized via npm package");

export interface EmailParams {
  recipientEmail: string;
  listingTitle: string;
  listingPrice: string;
  listingCategory: string;
  buyerNetid: string;
}

/**
 * Send an email notification using EmailJS
 */
export const sendEmailNotification = async (params: EmailParams): Promise<boolean> => {
  try {
    console.log('Sending email with params:', params);
    
    const templateParams = {
      to_email: params.recipientEmail,
      listing_title: params.listingTitle,
      listing_price: params.listingPrice,
      listing_category: params.listingCategory,
      buyer_netid: params.buyerNetid
    };

    // Clear any previous EmailJS flags
    localStorage.removeItem('emailjs_success');
    localStorage.removeItem('emailjs_timestamp');
    
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      USER_ID
    );
    
    console.log('Email sent successfully via EmailJS service:', response);
    localStorage.setItem('emailjs_success', 'true');
    localStorage.setItem('emailjs_timestamp', Date.now().toString());
    return true;
  } catch (error) {
    console.error('Failed to send email via EmailJS:', error);
    localStorage.removeItem('emailjs_success');
    return false;
  }
};

/**
 * Test function to directly test EmailJS integration
 * Call this from the browser console with:
 * import { testEmailJS } from './services/emailService';
 * testEmailJS();
 */
export const testEmailJS = async (): Promise<void> => {
  try {
    console.log('Testing EmailJS integration...');
    
    // Initialize EmailJS (in case it wasn't already)
    initEmailJS();
    
    // Prepare test template params
    const testParams = {
      email: 'hc8499@princeton.edu',
      title: 'Test Listing',
      price: '$99.99',
      category: 'Test Category'
    };
    
    console.log('Sending test email with params:', testParams);
    
    // Send the test email
    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      testParams,
      USER_ID
    );
    
    console.log('Test email successfully sent!', result);
  } catch (error) {
    console.error('Error in testEmailJS function:', error);
  }
}; 