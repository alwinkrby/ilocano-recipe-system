document.addEventListener('DOMContentLoaded', () => {
    const favContainer = document.getElementById('favoritesContainer');

    if (!favContainer) return; // Safety check

    fetch('http://localhost:3000/api/my-favorites', { credentials: 'include' })
        .then(res => {
            if (res.status === 401) {
                favContainer.innerHTML = '<div class="text-center mt-5"><p>Please <a href="login.html">log in</a> to view your saved dishes.</p></div>';
                throw new Error("Not logged in");
            }
            return res.json();
        })
        .then(data => {


            

            if (!Array.isArray(data)) {
            console.error("Expected array but got:", data);
            favContainer.innerHTML = `<p class="text-center text-danger">Error: ${data.message || 'Unknown error'}</p>`;
            return;
        }

        if (data.length === 0) {
            favContainer.innerHTML = '<p class="text-center gray">No saved recipes yet.</p>';
            return;
        }

            let html = '';
            data.forEach(dish => {
                // Formatting the rating to 1 decimal place (e.g., 4.8)
                const rating = dish.avg_rating ? Number(dish.avg_rating).toFixed(1) : "0.0";
                
                html += `
                    <div class="col-sm-12 col-lg-4 mb-3">
                        <a href="dishView.html?id=${dish.id}" class="text-decoration-none text-dark">
                            <div class="card rounded-4 border-0 shadow img-wrapper h-100">
                                <div class="position-relative">
                                    <img src="DishFiles/img/${dish.image_path}" class="card-img-top rounded-top-4" alt="${dish.dish_name}" style="height: 200px; object-fit: cover;">
                                    <div class="position-absolute top-0 end-0 m-2 d-flex gap-2">
                                        <div class="bg-white px-2 rounded-4 shadow-sm d-flex align-items-center">
                                            <i class="fa-solid fa-star" style="color: rgb(255, 212, 59);"></i>&nbsp;${rating}
                                        </div>
                                        <button class="btn btn-light rounded-circle shadow-sm save-btn" data-id="${dish.id}">
                                            <i class="fa-solid fa-bookmark" style="color: #ff6d05"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <h5 class="card-title fw-bold">${dish.dish_name}</h5>
                                    <p class="card-text gray clamp-2">${dish.description}</p>
                                    <hr>
                                    <div class="d-flex align-items-center">
                                        <i class="fa-regular fa-clock gray"></i>
                                        <p class="gray mb-0">&nbsp;${dish.prep_time || '30'}</p>
                                        <div class="ms-3 d-flex align-items-center">
                                            <i class="fa-solid fa-user-group gray"></i>
                                            <p class="gray mb-0">&nbsp;${dish.servings || '4'} Servings</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>`;
            });
            favContainer.innerHTML = html;
            setupUnsaveListener();
        })
        .catch(err => console.error("Error loading favorites:", err));
});



function setupUnsaveListener() {
    const favContainer = document.getElementById('favoritesContainer');
    
    favContainer.addEventListener('click', function(e) {
        // Find the button even if they click the icon inside it
        const btn = e.target.closest('.save-btn');
        if (!btn) return;


        // --- THE FIX IS HERE ---
        e.preventDefault();  // Prevents the link from following the URL
        e.stopPropagation(); // Stops the click from "bubbling up" to the card
        // -----------------------

        const dishId = btn.getAttribute('data-id');
        const cardColumn = btn.closest('.col-sm-12'); // Get the parent column to remove it

        fetch('http://localhost:3000/api/toggle-favorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dish_id: dishId }),
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.status === 'removed') {
                // Smoothly remove the card
                cardColumn.style.transition = '0.3s ease';
                cardColumn.style.opacity = '0';
                cardColumn.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    cardColumn.remove();
                    // Check if page is now empty to show the "No favorites" message
                    if (favContainer.querySelectorAll('.col-sm-12').length === 0) {
                        favContainer.innerHTML = '<p class="text-center gray">No saved recipes yet.</p>';
                    }
                }, 300);
            }
        })
        .catch(err => console.error("Error unsaving:", err));
    });
}