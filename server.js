// server.js - Backend server for the ThumpNail application

// Import necessary modules
const express = require('express'); // Express.js framework for building the web server
const sharp = require('sharp'); // Sharp library for image processing
const axios = require('axios'); // Axios for making HTTP requests (to fetch YouTube thumbnails)
const cors = require('cors'); // CORS middleware to allow cross-origin requests from the frontend

// Initialize the Express application
const app = express();
// Define the port the server will listen on, using environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// Enable CORS for all routes to allow frontend (running on a different port) to access the API
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());
// Serve static files (like index.html, script.js, style.css) from the directory where the server.js file is located
app.use(express.static(__dirname));

// --- Helper Functions ---

// Function to extract the YouTube video ID from a given URL
function extractVideoId(url) {
    // Return null if the URL is not provided
    if (!url) return null;
    // Regular expression to match various YouTube URL formats and capture the 11-character video ID
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    // Attempt to match the regex against the URL
    const match = url.match(regex);
    // Return the captured video ID (the first capturing group) or null if no match is found
    return match ? match[1] : null;
}

// Function to fetch an image from a given URL and return it as a Buffer
async function fetchImage(imageUrl) {
    try {
        // Make an HTTP GET request to the image URL, expecting binary data
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        // Convert the binary data to a Buffer and return it
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        // If the initial fetch fails (e.g., the high-resolution thumbnail 'maxresdefault.jpg' doesn't exist)
        if (imageUrl.includes('maxresdefault.jpg')) {
            // Construct a fallback URL using 'hqdefault.jpg' (standard quality)
            const fallbackUrl = imageUrl.replace('maxresdefault.jpg', 'hqdefault.jpg');
            console.log(`maxresdefault.jpg failed, trying ${fallbackUrl}`);
            try {
                // Attempt to fetch the image from the fallback URL
                const fallbackResponse = await axios.get(fallbackUrl, { responseType: 'arraybuffer' });
                // Convert fallback data to Buffer and return
                return Buffer.from(fallbackResponse.data, 'binary');
            } catch (fallbackError) {
                // Log error if fallback also fails
                console.error(`Error fetching fallback thumbnail ${fallbackUrl}:`, fallbackError.message);
                throw fallbackError; // Re-throw the fallback error
            }
        }
        // Log the original error if it wasn't a maxresdefault specific issue or if fallback wasn't attempted/failed
        console.error(`Error fetching thumbnail ${imageUrl}:`, error.message);
        throw error; // Re-throw the original error
    }
}

// --- Route for Thumbnail Generation ---
// Define a POST endpoint at '/api/generate-thumbnail'
app.post('/api/generate-thumbnail', async (req, res) => {
    // Extract the youtubeUrl from the request body
    const { youtubeUrl } = req.body;

    // Validate the presence and type of youtubeUrl
    if (!youtubeUrl || typeof youtubeUrl !== 'string') {
        // Send a 400 Bad Request response if validation fails
        return res.status(400).json({ error: 'Missing or invalid youtubeUrl' });
    }

    // Extract the video ID from the provided YouTube URL
    const videoId = extractVideoId(youtubeUrl);
    // Validate if a video ID was successfully extracted
    if (!videoId) {
        // Send a 400 Bad Request response if video ID extraction fails
        return res.status(400).json({ error: 'Invalid YouTube URL format or unable to extract Video ID' });
    }

    // Construct the URL for the original YouTube thumbnail (attempting high resolution first)
    const originalThumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    let imageBuffer; // Variable to store the fetched image buffer

    try {
        // Log the attempt to fetch the thumbnail
        console.log(`Fetching thumbnail for Video ID: ${videoId} from ${originalThumbnailUrl}`);
        // Fetch the image buffer using the helper function
        imageBuffer = await fetchImage(originalThumbnailUrl);
    } catch (error) {
        // Log error if fetching fails
        console.error('Error fetching original thumbnail:', error.message);
        // Check if the error indicates a 404 Not Found for the image
        if (error.response && error.response.status === 404) {
             // Send a 404 response if the original thumbnail is not found
             return res.status(404).json({ error: `Original thumbnail not found for Video ID: ${videoId}` });
        }
        // Send a 500 Internal Server Error for other fetching issues
        return res.status(500).json({ error: 'Failed to fetch original thumbnail. Check server logs.' });
    }

    try {
        // Log the start of image processing
        console.log('Processing image with Sharp...');
        // Use Sharp to process the image buffer
        const processedImageBuffer = await sharp(imageBuffer)
            // Example enhancement: Resize the image to a width of 1280 pixels, maintaining aspect ratio
            .resize({ width: 1280 })
            // Output the processed image as a JPEG with 90% quality
            .jpeg({ quality: 90 })
            // Convert the processed image back to a Buffer
            .toBuffer();

        // Convert the processed image buffer to a Base64 string
        const base64Image = processedImageBuffer.toString('base64');

        // Log successful image processing
        console.log('Image processed successfully.');
        // Send a JSON response containing the enhanced thumbnail data as a Base64 data URL
        res.json({
            enhancedThumbnailData: `data:image/jpeg;base64,${base64Image}`
        });
    } catch (error) {
        // Log error if image processing fails
        console.error('Error processing image with Sharp:', error.message);
        // Send a 500 Internal Server Error response for processing issues
        return res.status(500).json({ error: 'Image processing failed. Check server logs.' });
    }
});

// --- Start Server ---
// Start the Express server and listen on the specified PORT
// Only start the server if this file is run directly (not required as a module)
if (module.parent === null) {
    app.listen(PORT, () => {
        // Log a message indicating the server has started and the address
        console.log(`ThumpNail server running on http://localhost:${PORT}`);
        // Provide instructions for the frontend to connect to the API endpoint
        console.log(`Frontend should call POST http://localhost:${PORT}/api/generate-thumbnail`);
    });
}

// Export functions for testing
module.exports = {
    extractVideoId,
    fetchImage
};
