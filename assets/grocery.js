document.addEventListener('DOMContentLoaded', () => {
    const groceryContainer = document.getElementById('groceryListContainer');

    fetch('http://localhost:3000/api/my-grocery-list', { credentials: 'include' })
        .then(res => {
            if (res.status === 401) {
                throw new Error("UNAUTHORIZED");
            }
            return res.json();
        })
        .then(selectedDishes => {
            if (!selectedDishes || selectedDishes.length === 0) {
                groceryContainer.innerHTML = `
                    <p class="text-center gray mt-5">
                        Your grocery list is empty. 
                        <a href="alldishes.html" class="brown fw-bold text-decoration-underline">Browse recipes</a> to add ingredients!
                    </p>`;
                return;
            }

            let html = '';
            selectedDishes.forEach(dish => {
                html += generateGroceryHTML(dish);
            });
            groceryContainer.innerHTML = html;
        })
        .catch(err => {
            console.error("Error loading grocery list:", err);
            
            // Subtle hyperlink version
            groceryContainer.innerHTML = `
                <p class="text-center mt-5">
                    Please <a href="login.html" class=" text-decoration-underline">login</a> to view your grocery list.
                </p>`;
        });
});

// Template function for individual dish sections
function generateGroceryHTML(dish) {
    if (!dish.ingredients || dish.ingredients.trim() === "") {
        return `
            <div class="grocery-section mb-4" data-id="${dish.id}">
                <div class="border border-warning rounded-4 p-3 bg-light text-center">
                    <h5 class="brown">${dish.dish_name}</h5>
                    <p class="text-muted">No ingredients listed for this recipe.</p>
                </div>
            </div>`;
    }

    const ingredientList = dish.ingredients.split('\n').map(i => i.trim()).filter(i => i !== "");
    const totalCount = ingredientList.length;

    let ingredientsHTML = '';
    ingredientList.forEach((ingredient, index) => {
        const itemId = `dish${dish.id}-ing${index}`;
        ingredientsHTML += `
            <li>
                <div class="border border-warning py-3 ps-4 bg-white ${index === totalCount - 1 ? 'rounded-bottom-4' : ''}">
                    <div class="form-check custom-circle-checkbox">
                        <input class="form-check-input grocery-check" type="checkbox" id="${itemId}">
                        <label class="form-check-label" for="${itemId}">${ingredient}</label>
                    </div>
                </div>
            </li>`;
    });

    return `
        <div class="grocery-section mb-4" data-id="${dish.id}">
            <ul class="list-unstyled">
                <li>
                    <div class="border border-warning rounded-top-4 pt-3 ps-4 brownbg text-white">
                        <h5 class="mb-0">${dish.dish_name}</h5>
                        <p class="twelvefont remaining-count">${totalCount} of ${totalCount} remaining</p>
                    </div>
                </li>
                ${ingredientsHTML}
            </ul>
        </div>`;
}

// Checkbox logic for updating counts and triggering completion
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('grocery-check')) {
        const section = e.target.closest('.grocery-section');
        const allChecks = section.querySelectorAll('.grocery-check');
        const checkedCount = section.querySelectorAll('.grocery-check:checked').length;
        const remainingCount = allChecks.length - checkedCount;
        
        const countDisplay = section.querySelector('.remaining-count');
        countDisplay.innerText = `${remainingCount} of ${allChecks.length} remaining`;

        if (remainingCount === 0) {
            handleFinishedDish(section);
        }
    }
});

// Handles the animation and database deletion
function handleFinishedDish(section) {
    setTimeout(() => {
        // Animation
        section.style.transition = 'all 0.5s ease';
        section.style.opacity = '0';
        section.style.transform = 'translateX(20px)';

        setTimeout(() => {
            const dishId = section.getAttribute('data-id');

            // Delete from Database
            fetch('http://localhost:3000/api/remove-from-grocery', { // Add the full URL here
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dishId: dishId }),
                credentials: 'include' // Needed to send the session/cookie
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    section.remove();
                    
                    // Final check for empty state
                    const container = document.getElementById('groceryListContainer');
                    if (container.querySelectorAll('.grocery-section').length === 0) {
                        container.innerHTML = '<p class="text-center gray mt-5">All shopping done! Well done.</p>';
                    }
                }
            })
            .catch(err => console.error("Sync failed:", err));
        }, 500);
    }, 400);
}