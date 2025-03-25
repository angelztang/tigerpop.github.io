// Popup Modal that appears when users click "Create Listing"
import { useState } from "react";
import { createListing } from "../services/listingService";
import React from "react";

const ListingForm = ({ onClose }) => {
  const [formData, setFormData] = useState({ title: "", price: "", description: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createListing(formData);
    onClose();
    window.location.reload(); // Refresh for prototype
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Create Listing</h2>
        <input name="title" onChange={handleChange} placeholder="Title" className="border p-2 w-full" />
        <input name="price" onChange={handleChange} placeholder="Price" className="border p-2 w-full mt-2" />
        <textarea name="description" onChange={handleChange} placeholder="Description" className="border p-2 w-full mt-2" />
        
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="mr-2 text-gray-500">Cancel</button>
          <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
        </div>
      </div>
    </div>
  );
};

export default ListingForm;
