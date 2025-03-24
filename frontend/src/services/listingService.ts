// Handles fetching, creating, and updating listings (API calls)

export const fetchListings = async () => {
    const res = await fetch("http://localhost:5000/api/listings");
    return res.json();
  };
  
  export const createListing = async (data) => {
    await fetch("http://localhost:5000/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };
  
  export const updateListingStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/listings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };
  