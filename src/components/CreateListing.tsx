import { useNavigate } from 'react-router-dom';
import { createListing, CreateListingData } from '../services/listingService';
import { getUserId } from '../services/authService';
// ... existing code ...
const CreateListing = () => {
  const navigate = useNavigate();
  // ... existing code ...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const userId = getUserId();
    const netid = localStorage.getItem('netid');

    if (!userId || !netid) {
      console.error('User ID or netid not found');
      return;
    }

    try {
      const listingData = {
        netid: netid,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        category: formData.get('category') as string,
        images: [], // You'll need to handle image uploads separately
        condition: formData.get('condition') as string,
        user_id: parseInt(userId)
      };

      await createListing(listingData);
      navigate('/');  // Redirect to homepage
    } catch (error) {
      console.error('Error creating listing:', error);
    }
  };
  // ... existing code ...
}

export default CreateListing;