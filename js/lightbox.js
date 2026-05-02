// Lightbox functionality for photos
function initLightbox() {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  gallery.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG') {
      const lightbox = document.createElement('div');
      lightbox.id = 'lightbox';
      lightbox.innerHTML = `<div id="lightbox-content"><img src="${e.target.src}"><button id="close-btn">Close</button></div>`;
      document.body.appendChild(lightbox);

      document.getElementById('close-btn').addEventListener('click', function() {
        document.body.removeChild(lightbox);
      });
    }
  });
}

// Initialize lightbox on load
window.addEventListener('DOMContentLoaded', initLightbox);