let selectedRating = 0; // Default rating

    // 2. Add the listener for the stars
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.clickable-star').forEach(star => {
            star.addEventListener('click', function() {
                selectedRating = parseInt(this.getAttribute('data-value'));
                
                // UI Update: Reset and Fill stars
                document.querySelectorAll('.clickable-star').forEach((s, index) => {
                    if (index < selectedRating) {
                        s.classList.replace('fa-regular', 'fa-solid');
                    } else {
                        s.classList.replace('fa-solid', 'fa-regular');
                    }
                });
            });
        });
    });

const urlParams = new URLSearchParams(window.location.search);
const dishId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Get the Dish ID from the URL (e.g., details.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('id');

    if (!dishId) {
        window.location.href = 'index.html'; // This is fine, it just sends users back if no ID is in the URL
        return;
    }

    // 2. Fetch the dish data from your server
    fetch(`http://localhost:3000/api/dish/${dishId}`, {
            method: 'GET',
            credentials: 'include' // THIS IS CRITICAL
            
        })
        .then(response => response.json())
        .then(data => {

            const bookmarkIcon = document.getElementById('bookmarkIcon');
            if (bookmarkIcon) {
                if (data.isFavorite) {
                    bookmarkIcon.classList.replace('fa-regular', 'fa-solid');
                } else {
                    bookmarkIcon.classList.replace('fa-solid', 'fa-regular');
                }
            }

            const dish = data.dish;
            const ingredients = data.ingredients;
            const steps = data.steps;
            
            console.log("Is the server seeing me as logged in?:", data.isLoggedIn);

            if (data.isLoggedIn === true && loginAlert) {
                // Option A: The Bootstrap way
                loginAlert.classList.add('d-none'); 
                console.log("Login alert should now be hidden.");
            }

            // 3. Fill the Basic Information
            document.getElementById('DishName').innerText = dish.dish_name;
            document.getElementById('DishPhonetic').innerText = dish.phonetic ? `(${dish.phonetic})` : "";
            document.getElementById('DishDescription').innerText = dish.description;
            document.getElementById('PrepTime').innerText = dish.prep_time;
            document.getElementById('CookTime').innerText = dish.cooking_time;
            document.getElementById('Servings').innerText = dish.servings;
            document.getElementById('DishHistory').innerText = dish.dish_history;
            document.getElementById('dishIMG').src = `http://localhost:3000/DishFiles/img/${dish.image_path}`;
            
            // Set up the Author name
            const authorElement = document.getElementById('UserFullName');
            authorElement.innerHTML = `<span class="brown">Shared by:</span> ${dish.added_by || "Anonymous"}`;

            // 4. Handle Audio (If exists)
            if (dish.audio_path) {
                const audioSource = document.querySelector('#myAudio source');
                audioSource.src = `http://localhost:3000/DishFiles/audio/${dish.audio_path}`;
                document.getElementById('myAudio').load();
            } else {
                document.getElementById('DishAudio').style.display = 'none'; // Hide button if no audio
            }

            // 5. Handle Ingredients (Splitting into your 2 columns)
            const list1 = document.getElementById('DishIngredients1');
            const list2 = document.getElementById('DishIngredients2');
            
            // Clear existing empty <li> tags
            list1.innerHTML = "";
            list2.innerHTML = "";

            ingredients.forEach((ing, index) => {
                const li = `<li class="p-2">${ing.ingredient_name}</li>`;
                // Split them 50/50 between the two columns
                if (index < Math.ceil(ingredients.length / 2)) {
                    list1.innerHTML += li;
                } else {
                    list2.innerHTML += li;
                }
            });

            // 6. Handle Methods (Badges)

            const cookContainer = document.getElementById('cookingMethodsContainer')
            const prepContainer = document.getElementById('prepMethodsContainer')

            // Clear the static placeholders
            cookContainer.querySelectorAll('.lightbrownBG').forEach(el => el.remove());
            prepContainer.querySelectorAll('.lightbrownBG').forEach(el => el.remove());

            
            if (dish.cooking_methods) { 
                cookContainer.innerHTML = dish.cooking_methods.split(',').map(m => 
                    `<div class="lightbrownBG rounded-4 p-2 d-inline-block brown m-1"><b>${m.trim()}</b></div>`
                ).join('');
            }

            // Preparation Methods

            // Check if your database column is 'preparation_method' (singular)
            if (dish.preparation_method) {
                prepContainer.innerHTML = dish.preparation_method.split(',').map(p => 
                    `<div class="lightbrownBG rounded-4 p-2 d-inline-block brown m-1"><b>${p.trim()}</b></div>`
                ).join('');
            }

            // 7. Handle Steps
            const stepsContainer = document.getElementById('stepsContainer');
            
            if (stepsContainer) {
                // Clear the container first
                stepsContainer.innerHTML = ''; 
                
                steps.forEach((step, index) => {
                    stepsContainer.innerHTML += `
                        <div class="d-flex gap-3 mt-4">
                            <div class="step-circle buttonOrange text-white d-flex align-items-center justify-content-center">
                                <h5 class="mb-0">${index + 1}</h5>
                            </div>
                            <div>
                                <h6 class="fw-bold">${step.step_title}</h6>
                                <p>${step.step_description}</p>
                            </div>
                        </div>`;
                });
            }

            // Inside your .then(data => { ... }) block in details.js
            const reviewsContainer = document.getElementById('reviewsContainer');

            if (data.reviews && data.reviews.length > 0) {
                reviewsContainer.innerHTML = data.reviews.map(rev => {
                    // Generate the stars based on the rating number
                    const stars = Array(rev.rating).fill('<i class="fa-solid fa-star" style="color: rgb(255, 212, 59);"></i>').join('');
                    
                    // Format the date (e.g., April 18, 2026)
                    const date = new Date(rev.created_at).toLocaleDateString();

                    return `
                        <div class="border mt-5 rounded-4 p-4">
                            <div class="d-flex align-items-center">
                                <h5>${rev.fullname}</h5>
                                <div class="ms-auto">
                                    ${stars}
                                </div>
                                <button class="btn p-0 border-0 bg-transparent ms-3" onclick="deleteComment(${rev.review_id})">
                                    <i class="fa-regular fa-circle-xmark text-danger" style="font-size: 1.5rem;"></i>
                                </button>
                            </div>
                            <p class="fs-6 text-muted">${date}</p>
                            <p>${rev.comment}</p>
                        </div>
                    `;
                }).join('');
            } else {
                reviewsContainer.innerHTML = `<p class="text-muted mt-4">No reviews yet. Be the first to share your thoughts!</p>`;
            }

        })
        .catch(err => console.error("Error loading dish:", err));
});


const submitBtn = document.getElementById('submitReviewBtn');

if (submitBtn) {
    submitBtn.addEventListener('click', function() {
    const commentText = document.getElementById('reviewText').value;
    const starRating = 5; // We will make this dynamic later!
    
    // Get dishId from the URL (you likely already have this variable)
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('id');

    if (!commentText) {
        alert("Please write a comment first!");
        return;
    }

    if (selectedRating === 0) {
        alert("Please select a star rating!");
        return;
    }

    fetch('http://localhost:3000/api/add-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dish_id: dishId,
            rating: selectedRating,
            comment: commentText
        }),
        credentials: 'include' // Important for the session!
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Review posted!");
            location.reload(); // Refresh to show the new review
        } else {
            alert(data.message);
        }
    })
    .catch(err => console.error("Error posting review:", err));
    });
}


function deleteComment(reviewId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    fetch(`http://localhost:3000/api/delete-review/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload(); // Refresh to show it's gone
        } else {
            alert("You can only delete your own comments!");
        }
    });
}


const bookmarkBtn = document.getElementById('bookmarkBtn');

if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', function() {
        const icon = document.getElementById('bookmarkIcon');

        fetch('http://localhost:3000/api/toggle-favorite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dish_id: dishId }),
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Toggle the visual icon based on the server response
                if (data.status === 'added') {
                    icon.classList.replace('fa-regular', 'fa-solid');
                    console.log("Recipe saved!");
                } else {
                    icon.classList.replace('fa-solid', 'fa-regular');
                    console.log("Recipe removed!");
                }
            } else {
                alert("Please log in to save recipes!");
                window.location.href = 'login.html';
            }
        })
        .catch(err => console.error("Error toggling bookmark:", err));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dishId = urlParams.get('id');
    const groceryBtn = document.getElementById('addGroceryBtn');

    if (groceryBtn && dishId) {
        groceryBtn.addEventListener('click', function() {
            // We FETCH the data from the server, we don't define the route here
            fetch('http://localhost:3000/api/add-to-grocery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dishId: dishId }),
                credentials: 'include' 
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    this.innerHTML = "<b>Added to Account!</b>";
                    this.style.backgroundColor = "#28a745";
                } else {
                    alert("Please log in to save your grocery list.");
                }
            })
            .catch(err => console.error("Error:", err));
        });
    }
});

