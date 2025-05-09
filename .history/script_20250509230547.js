document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const generateBtn = document.getElementById('generate-btn');
    const beforeBtn = document.getElementById('before-btn');
    const afterBtn = document.getElementById('after-btn');
    const youtubeUrlInput = document.getElementById('youtube-url');
    const thumbnailPlaceholder = document.getElementById('thumbnail-placeholder');
    const thumbnailImage = document.getElementById('thumbnail-image');
    const placeholderText = thumbnailPlaceholder.querySelector('p');

    // --- Theme Switcher ---
    // Check for saved theme preference or use system preference
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeToggle.checked = true;
        }
    } else {
        // If no saved theme, check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }
    }

    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Generate Thumbnail Button ---
    generateBtn.addEventListener('click', () => {
        const url = youtubeUrlInput.value;
        if (!url.trim()) {
            alert('Please enter a YouTube URL.');
            return;
        }
        console.log('Generate Thumbnail clicked for URL:', url);
        // Placeholder action: Show a mock "enhanced" thumbnail
        placeholderText.style.display = 'none';
        thumbnailImage.src = 'https://via.placeholder.com/640x360.png?text=Enhanced+Thumbnail+(After)';
        thumbnailImage.alt = 'Enhanced Thumbnail (After)';
        thumbnailImage.style.display = 'block';
        
        // Activate "After" button
        beforeBtn.classList.remove('active');
        afterBtn.classList.add('active');

        alert('Thumbnail generation initiated (placeholder)!\nURL: ' + url + '\nCheck console for details.');
        // In a real scenario, this would trigger API calls and image processing.
    });

    // --- Before/After Buttons ---
    beforeBtn.addEventListener('click', () => {
        if (!thumbnailImage.src || thumbnailImage.src.endsWith('#')) {
            alert('Generate a thumbnail first to use Before/After controls.');
            return;
        }
        console.log('Before button clicked');
        thumbnailImage.src = 'https://via.placeholder.com/640x360.png?text=Original+Thumbnail+(Before)';
        thumbnailImage.alt = 'Original Thumbnail (Before)';
        beforeBtn.classList.add('active');
        afterBtn.classList.remove('active');
        // Placeholder: Show original thumbnail
    });

    afterBtn.addEventListener('click', () => {
        if (!thumbnailImage.src || thumbnailImage.src.endsWith('#')) {
            alert('Generate a thumbnail first to use Before/After controls.');
            return;
        }
        console.log('After button clicked');
        thumbnailImage.src = 'https://via.placeholder.com/640x360.png?text=Enhanced+Thumbnail+(After)';
        thumbnailImage.alt = 'Enhanced Thumbnail (After)';
        afterBtn.classList.add('active');
        beforeBtn.classList.remove('active');
        // Placeholder: Show enhanced thumbnail
    });

    // Initial state for placeholder
    if (thumbnailImage.style.display === 'none') {
        placeholderText.style.display = 'block';
    }
});
