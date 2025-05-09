// server.js
const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies

// --- Helper Functions ---
function extractVideoId(url) {
    if (!url) return null;
    // Regex to capture video ID from various YouTube URL formats
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function fetchImage(imageUrl) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        // If the first attempt fails (e.g. maxresdefault.jpg not found), try a fallback
        if (imageUrl.includes('maxresdefault.jpg')) {
            const fallbackUrl = imageUrl.replace('maxresdefault.jpg', 'hqdefault.jpg');
            console.log(`maxresdefault.jpg failed, trying ${fallbackUrl}`);
            try {
                const fallbackResponse = await axios.get(fallbackUrl, { responseType: 'arraybuffer' });
                return Buffer.from(fallbackResponse.data, 'binary');
            } catch (fallbackError) {
                console.error(`Error fetching fallback thumbnail ${fallbackUrl}:`, fallbackError.message);
                throw fallbackError; // Re-throw if fallback also fails
            }
        }
        console.error(`Error fetching thumbnail ${imageUrl}:`, error.message);
        throw error; // Re-throw original error if not maxresdefault or if it's another issue
    }
}

// --- Route for Thumbnail Generation ---
app.post('/api/generate-thumbnail', async (req, res) => {
    const { youtubeUrl } = req.body;

    if (!youtubeUrl || typeof youtubeUrl !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid youtubeUrl' });
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL format or unable to extract Video ID' });
    }

    const originalThumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    let imageBuffer;

    try {
        console.log(`Fetching thumbnail for Video ID: ${videoId} from ${originalThumbnailUrl}`);
        imageBuffer = await fetchImage(originalThumbnailUrl);
    } catch (error) {
        console.error('Error fetching original thumbnail:', error.message);
        // Check if it's a 404-like error for the image itself
        if (error.response && error.response.status === 404) {
             return res.status(404).json({ error: `Original thumbnail not found for Video ID: ${videoId}` });
        }
        return res.status(500).json({ error: 'Failed to fetch original thumbnail. Check server logs.' });
    }

    try {
        console.log('Processing image with Sharp...');
        const processedImageBuffer = await sharp(imageBuffer)
            // Example: Resize to a common HD thumbnail width, maintaining aspect ratio for height
            .resize({ width: 1280 }) 
            .jpeg({ quality: 90 }) // Output as JPEG with 90% quality
            .toBuffer();
        
        const base64Image = processedImageBuffer.toString('base64');
        
        console.log('Image processed successfully.');
        res.json({ 
            enhancedThumbnailData: `data:image/jpeg;base64,${base64Image}` 
        });
    } catch (error) {
        console.error('Error processing image with Sharp:', error.message);
        return res.status(500).json({ error: 'Image processing failed. Check server logs.' });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`ThumpNail server running on http://localhost:${PORT}`);
    console.log(`Frontend should call POST http://localhost:${PORT}/api/generate-thumbnail`);
});
