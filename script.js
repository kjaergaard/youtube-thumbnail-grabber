// Helper function to extract YouTube video ID from a URL (moved to global scope)
function extractVideoIdFromUrl(url) {
    if (!url) return null;
    // Regex to match various YouTube URL formats and capture the video ID
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null; // Return the captured video ID or null
}

// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
    // Get references to key DOM elements
    const themeToggle = document.getElementById('theme-toggle');
    const generateBtn = document.getElementById('generate-btn');
    const beforeBtn = document.getElementById('before-btn');
    const afterBtn = document.getElementById('after-btn');
    const youtubeUrlInput = document.getElementById('youtube-url');
    const thumbnailPlaceholder = document.getElementById('thumbnail-placeholder');
    const thumbnailImage = document.getElementById('thumbnail-image');
    const placeholderText = thumbnailPlaceholder.querySelector('p');

    // --- Theme Switcher ---
    // Check for saved theme preference in local storage or use system preference
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    if (currentTheme) {
        // Apply the saved theme
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            // Check the toggle if the theme is dark
            themeToggle.checked = true;
        }
    } else {
        // If no saved theme, check the user's system preference for dark mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // Apply dark mode if system preference is dark
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }
    }

    // Add event listener to the theme toggle checkbox
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            // If checked, set theme to dark and save preference
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            // If not checked, set theme to light and save preference
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Generate Thumbnail Button ---
    // Add event listener to the generate button
    generateBtn.addEventListener('click', async () => {
        // Get the YouTube URL from the input field
        const youtubeUrl = youtubeUrlInput.value;
        // Validate if the URL input is empty
        if (!youtubeUrl.trim()) {
            alert('Please enter a YouTube URL.');
            return;
        }

        // Show loading state to the user
        placeholderText.textContent = 'Generating... Please wait.';
        placeholderText.style.display = 'block';
        thumbnailImage.style.display = 'none';
        generateBtn.disabled = true; // Disable button to prevent multiple clicks

        try {
            // Send a POST request to the backend to generate the thumbnail
            const response = await fetch('http://localhost:3000/api/generate-thumbnail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ youtubeUrl }), // Send the YouTube URL in the request body
            });

            // Parse the JSON response from the backend
            const result = await response.json();

            // Check if the response was successful
            if (response.ok) {
                // Hide the placeholder text and display the generated thumbnail
                placeholderText.style.display = 'none';
                thumbnailImage.src = result.enhancedThumbnailData; // Set the image source to the base64 data
                thumbnailImage.alt = 'Enhanced Thumbnail';
                thumbnailImage.style.display = 'block';
                // Store original URL and enhanced data for "Before/After" functionality
                thumbnailImage.dataset.originalUrl = youtubeUrl; // Store original URL
                thumbnailImage.dataset.enhancedData = result.enhancedThumbnailData; // Store enhanced data

                // Activate the "After" button and deactivate "Before"
                beforeBtn.classList.remove('active');
                afterBtn.classList.add('active');
            } else {
                // If response is not ok, throw an error with the error message from the backend
                throw new Error(result.error || `Server error: ${response.status}`);
            }
        } catch (error) {
            // Catch and display any errors during the generation process
            console.error('Error generating thumbnail:', error);
            alert(`Error: ${error.message}`);
            // Show error message in the placeholder
            placeholderText.textContent = 'Failed to generate thumbnail. Please try again.';
            placeholderText.style.display = 'block';
            thumbnailImage.style.display = 'none';
        } finally {
            // Re-enable the generate button after the process is complete
            generateBtn.disabled = false;
        }
    });

    // --- Before/After Buttons ---
    // Event listener for the "Before" button
    beforeBtn.addEventListener('click', () => {
        // Check if a thumbnail has been generated
        if (!thumbnailImage.dataset.originalUrl) {
            alert('Generate a thumbnail first to use Before/After controls.');
            return;
        }
        console.log('Before button clicked (showing placeholder for original)');
        // Extract video ID from the original URL to construct the original thumbnail URL
        const videoId = extractVideoIdFromUrl(thumbnailImage.dataset.originalUrl);
        if (videoId) {
            // Set the image source to the approximate original YouTube thumbnail
            thumbnailImage.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            thumbnailImage.alt = 'Original Thumbnail (Approx.)';
            thumbnailImage.style.display = 'block'; // Ensure image is visible
            placeholderText.style.display = 'none'; // Hide placeholder text
        } else {
            // If video ID cannot be extracted, show a placeholder text
            thumbnailImage.style.display = 'none';
            placeholderText.textContent = 'Original thumbnail placeholder';
            placeholderText.style.display = 'block';
        }
        // Activate the "Before" button and deactivate "After"
        beforeBtn.classList.add('active');
        afterBtn.classList.remove('active');
    });

    // Event listener for the "After" button
    afterBtn.addEventListener('click', async () => { // Make it async if re-fetching
        // Check if a thumbnail has been generated
        if (!thumbnailImage.dataset.originalUrl) {
            alert('Generate a thumbnail first to use Before/After controls.');
            return;
        }
        console.log('After button clicked (re-showing enhanced)');

        // Restore the enhanced thumbnail from the stored data attribute
        if (thumbnailImage.dataset.enhancedData) {
            thumbnailImage.src = thumbnailImage.dataset.enhancedData;
            thumbnailImage.alt = 'Enhanced Thumbnail';
            thumbnailImage.style.display = 'block'; // Ensure image is visible
            placeholderText.style.display = 'none'; // Hide placeholder text
        } else {
            // If no stored enhanced data, alert the user
            alert("Please generate a thumbnail first or re-generate for 'After' view.");
            return;
        }

        // Activate the "After" button and deactivate "Before"
        afterBtn.classList.add('active');
        beforeBtn.classList.remove('active');
    });

    // Initial state for the thumbnail placeholder text
    // If the image is hidden and the placeholder doesn't indicate generating, set the default text
    if (thumbnailImage.style.display === 'none' && !placeholderText.textContent.includes('Generating')) {
        placeholderText.textContent = 'Your enhanced thumbnail will appear here.';
        placeholderText.style.display = 'block';
    }
});

// Export for testing purposes (if using CommonJS environment for tests like Jest)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extractVideoIdFromUrl };
}
