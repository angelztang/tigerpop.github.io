const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the dist directory
app.use(express.static('dist'));

// Handle React routing by serving index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 