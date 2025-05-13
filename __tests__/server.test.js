const { extractVideoId, fetchImage } = require('../server'); // Assuming these functions are exported

// Mock axios for fetchImage tests
jest.mock('axios');
const axios = require('axios');

describe('server.js', () => {
  beforeEach(() => {
    axios.get.mockClear(); // Clear mock state before each test
  });

  // Test suite for extractVideoId
  describe('extractVideoId', () => {
    // Test cases for valid YouTube URLs
    test('should extract video ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const videoId = extractVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from shortened youtu.be URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      const videoId = extractVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from YouTube URL with extra parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s';
      const videoId = extractVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from YouTube embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const videoId = extractVideoId(url);
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from YouTube URL with feature parameter', () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be';
        const videoId = extractVideoId(url);
        expect(videoId).toBe('dQw4w9WgXcQ');
    });

    // Test cases for invalid or non-YouTube URLs
    test('should return null for invalid YouTube URL', () => {
      const url = 'https://www.google.com/';
      const videoId = extractVideoId(url);
      expect(videoId).toBeNull();
    });

    test('should return null for URL without video ID', () => {
      const url = 'https://www.youtube.com/';
      const videoId = extractVideoId(url);
      expect(videoId).toBeNull();
    });

    test('should return null for empty string', () => {
      const url = '';
      const videoId = extractVideoId(url);
      expect(videoId).toBeNull();
    });

    test('should return null for null input', () => {
      const url = null;
      const videoId = extractVideoId(url);
      expect(videoId).toBeNull();
    });

     test('should return null for undefined input', () => {
      const url = undefined;
      const videoId = extractVideoId(url);
      expect(videoId).toBeNull();
    });
  });

  // Test suite for fetchImage (requires mocking axios)
  describe('fetchImage', () => {
    // TODO: Add tests for fetchImage, including testing the fallback logic
    // You will need to mock axios.get to simulate different responses (success, 404 for maxresdefault, success for hqdefault)

    test('should fetch image successfully', async () => {
      const mockImageData = Buffer.from('fake image data');
      axios.get.mockResolvedValueOnce({ data: mockImageData }); // Removed responseType from mock, it's an implementation detail of the call

      const imageUrl = 'https://img.youtube.com/vi/test/maxresdefault.jpg';
      const imageBuffer = await fetchImage(imageUrl);

      expect(axios.get).toHaveBeenCalledWith(imageUrl, { responseType: 'arraybuffer' });
      expect(imageBuffer).toEqual(mockImageData);
    });

    test('should fallback to hqdefault.jpg if maxresdefault.jpg fails with 404', async () => {
        const mockImageData = Buffer.from('fake fallback image data');
        const maxresUrl = 'https://img.youtube.com/vi/test/maxresdefault.jpg';
        const hqUrl = 'https://img.youtube.com/vi/test/hqdefault.jpg';

        axios.get
            .mockRejectedValueOnce({ 
                response: { status: 404 },
                message: 'Not Found' // Keep message for console output in server.js
            })
            .mockResolvedValueOnce({ 
                data: mockImageData 
            });

        const imageBuffer = await fetchImage(maxresUrl);

        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(axios.get).toHaveBeenNthCalledWith(1, maxresUrl, { responseType: 'arraybuffer' });
        expect(axios.get).toHaveBeenNthCalledWith(2, hqUrl, { responseType: 'arraybuffer' });
        expect(imageBuffer).toEqual(mockImageData);
    });

    test('should throw error if both maxresdefault.jpg and hqdefault.jpg fail', async () => {
        const maxresUrl = 'https://img.youtube.com/vi/test/maxresdefault.jpg';
        const hqUrl = 'https://img.youtube.com/vi/test/hqdefault.jpg';
        const firstError = { response: { status: 404 }, message: 'Not Found for maxres' };
        const secondError = new Error('Network Error for hq'); // This error will be thrown by fetchImage

        axios.get
            .mockRejectedValueOnce(firstError)
            .mockRejectedValueOnce(secondError);

        await expect(fetchImage(maxresUrl)).rejects.toThrow('Network Error for hq');

        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(axios.get).toHaveBeenNthCalledWith(1, maxresUrl, { responseType: 'arraybuffer' });
        expect(axios.get).toHaveBeenNthCalledWith(2, hqUrl, { responseType: 'arraybuffer' });
    });

     test('should throw specified error if initial fetch for non-maxresdefault URL fails', async () => {
        const imageUrl = 'https://img.youtube.com/vi/test/someother.jpg'; // Not maxresdefault
        const originalError = new Error('Specific Network Error');

        axios.get.mockRejectedValueOnce(originalError);

        await expect(fetchImage(imageUrl)).rejects.toThrow('Specific Network Error');

        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith(imageUrl, { responseType: 'arraybuffer' });
    });

    test('should throw error if initial fetch for maxresdefault fails with non-404, and fallback also fails', async () => {
        const maxresUrl = 'https://img.youtube.com/vi/test/maxresdefault.jpg';
        const hqUrl = 'https://img.youtube.com/vi/test/hqdefault.jpg';
        const initialError = new Error('Initial Generic Error'); // Non-404 type error
        const fallbackErrorToThrow = new Error('Fallback Failed Too');

        axios.get
            .mockRejectedValueOnce(initialError)       // First call (maxresUrl) fails with a generic error
            .mockRejectedValueOnce(fallbackErrorToThrow); // Second call (hqUrl, the fallback) also fails

        await expect(fetchImage(maxresUrl)).rejects.toThrow('Fallback Failed Too');

        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(axios.get).toHaveBeenNthCalledWith(1, maxresUrl, { responseType: 'arraybuffer' });
        expect(axios.get).toHaveBeenNthCalledWith(2, hqUrl, { responseType: 'arraybuffer' });
    });
  });
});
