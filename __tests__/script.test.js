describe('script.js', () => {
  // Mock the DOMContentLoaded event listener and import the function
  document.addEventListener = jest.fn();
  const { extractVideoIdFromUrl } = require('../script.js');

  // Import the function to be tested
  // Assuming extractVideoIdFromUrl is globally available or can be imported
  // If not globally available, we might need to adjust how it's accessed for testing.
  // For now, assuming it's accessible in the test environment.
  // If it's not, we'll need to read script.js again and figure out how to export it.

  // Test suite for extractVideoIdFromUrl
  describe('extractVideoIdFromUrl', () => {
    // Test cases for valid YouTube URLs
    test('should extract video ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const videoId = extractVideoIdFromUrl(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from shortened youtu.be URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const videoId = extractVideoIdFromUrl(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from YouTube URL with extra parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s';
      const videoId = extractVideoIdFromUrl(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from YouTube embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const videoId = extractVideoIdFromUrl(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from YouTube URL with feature parameter', () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be';
        const videoId = extractVideoIdFromUrl(url);
        expect(videoId).toBe('dQw4w9WgXcQ');
    });

    // Test cases for invalid or non-YouTube URLs
    test('should return null for invalid YouTube URL', () => {
      const url = 'https://www.google.com/';
      const videoId = extractVideoIdFromUrl(url);
      expect(videoId).toBeNull();
    });

    test('should return null for URL without video ID', () => {
      const url = 'https://www.youtube.com/';
      const videoId = extractVideoIdFromUrl(url);
      expect(videoId).toBeNull();
    });

    test('should return null for empty string', () => {
      const url = '';
      const videoId = extractVideoIdFromUrl(url);
      expect(videoId).toBeNull();
    });

    test('should return null for null input', () => {
      const url = null;
      const videoId = extractVideoIdFromUrl(url);
      expect(videoId).toBeNull();
    });

     test('should return null for undefined input', () => {
      const url = undefined;
      const videoId = extractVideoIdFromUrl(url);
      expect(videoId).toBeNull();
    });
  });
});

// Note: The extractVideoIdFromUrl function is assumed to be accessible in this scope.
// If it's not, we might need to modify script.js to export it.
