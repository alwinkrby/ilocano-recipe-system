// -------------------------------- RATING SYSTEM --------------------------------
const stars = document.querySelectorAll('.star');
const ratingValue = document.querySelector('.rating-value');
let rating = 0;

stars.forEach(star => {
  star.addEventListener('mouseover', () => {
    resetStars();
    highlightStars(star.dataset.value);
  });

  star.addEventListener('mouseout', () => {
    resetStars();
    highlightStars(rating);
  });

  star.addEventListener('click', () => {
    rating = star.dataset.value;
    if(ratingValue) ratingValue.textContent = `Your rating: ${rating}`;
  });
});

function resetStars() {
  stars.forEach(s => s.classList.remove('hover', 'selected'));
}

function highlightStars(value) {
  stars.forEach(star => {
    if (star.dataset.value <= value) {
      star.classList.add(rating ? 'selected' : 'hover');
    }
  });
}

// -------------------------------- REPORT MODAL --------------------------------
const reportModal = document.getElementById("reportModal");
const openReportBtn = document.getElementById("openReportModal");
const cancelReportBtn = document.getElementById("cancelBtn");
const reportForm = document.getElementById("reportForm");
const otherContainer = document.getElementById("otherReasonContainer");
const otherInput = document.getElementById("otherReasonDetails");
const radioButtons = document.querySelectorAll('input[name="reason"]');

// Open modal
if (openReportBtn) {
    openReportBtn.addEventListener("click", () => {
        reportModal.style.display = "block";
    });
}

// Close modal (cancel button)
if (cancelReportBtn) {
    cancelReportBtn.addEventListener("click", () => {
        reportModal.style.display = "none";
        reportForm.reset();
        if (otherContainer) otherContainer.style.display = "none";
    });
}

// Close when clicking outside (Using addEventListener to prevent overwriting other scripts)
window.addEventListener("click", (e) => {
    if (e.target === reportModal) {
        reportModal.style.display = "none";
        reportForm.reset();
        if (otherContainer) otherContainer.style.display = "none";
    }
});

// Toggle "Other Reason" Textbox
radioButtons.forEach(radio => {
    radio.addEventListener("change", (e) => {
        if (e.target.id === "reasonOther") {
            otherContainer.style.display = "block";
            otherInput.required = true;
            otherInput.focus();
        } else {
            otherContainer.style.display = "none";
            otherInput.required = false;
            otherInput.value = ""; 
        }
    });
});

// Handle Report Submission
if (reportForm) {
    reportForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Thank you for your report.");
        reportModal.style.display = "none";
        reportForm.reset();
        if (otherContainer) otherContainer.style.display = "none";
    });
}


// -------------------------------- SEARCH --------------------------------
// function searchDish() {
//   const searchInput = document.getElementById("searchInput");
//   if (!searchInput) return;

//   const input = searchInput.value.toLowerCase().trim();
//   const dishes = document.querySelectorAll("#dishList .dish");

//   dishes.forEach(dish => {
//     const title = dish.querySelector("h5");
//     if (!title) return;
//     const name = title.textContent.toLowerCase();
    
//     if (input === "") {
//       dish.style.display = "none";
//     } else {
//       dish.style.display = name.includes(input) ? "" : "none";
//     }
//   });
// }

// function initializeSearch() {
//   const searchBox = document.getElementById("searchInput");
//   const dishes = document.querySelectorAll("#dishList .dish");

//   if (!searchBox) return;

//   const urlParams = new URLSearchParams(window.location.search);
//   const searchTerm = urlParams.get('q');

//   if (searchTerm) {
//     searchBox.value = decodeURIComponent(searchTerm);
//     searchDish();
//   } else {
//     dishes.forEach(dish => { dish.style.display = "none"; });
//   }

//   searchBox.addEventListener('keyup', searchDish);
// }


document.addEventListener('DOMContentLoaded', () => {
    
    // Using your exact IDs from the HTML
    const navbarSearchInput = document.getElementById('navbarSearchInput');
    const searchInput = document.getElementById('searchInput');

    // 1. Navbar Search Logic
    navbarSearchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query.length > 0) {
                // Redirect to search page with the query in the URL
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        }
    });

    // 2. On-Page Search Logic (search.html)
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query.length > 0) {
                // Update results without leaving the page
                performDatabaseSearch(query);
                
                // Update the URL bar so it stays if they refresh
                const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
            }
        }
    });

    // 3. Initial Load Check (For when you arrive from another page)
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    if (initialQuery && searchInput) {
        searchInput.value = initialQuery;
        performDatabaseSearch(initialQuery);
    }
});

function performSearch(query) {
    if (query.length < 2) return; // Don't search for just 1 letter

    fetch(`http://localhost:3000/api/search-dishes?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(dishes => {
            displaySearchResults(dishes);
        })
        .catch(err => console.error("Search failed:", err));
}

// function displaySearchResults(dishes) {
//     const container = document.getElementById('dishesContainer'); // Your main cards container
//     if (!container) return;

//     if (dishes.length === 0) {
//         container.innerHTML = '<p class="text-center mt-5">No recipes found matching your search.</p>';
//         return;
//     }

//     // Map the results into your card HTML template
//     container.innerHTML = dishes.map(dish => `
//         <div class="col-md-4 mb-4">
//             <div class="card h-100 border-warning rounded-4 overflow-hidden">
//                 <img src="uploads/${dish.image_path}" class="card-img-top" alt="${dish.dish_name}" style="height: 200px; object-fit: cover;">
//                 <div class="card-body">
//                     <h5 class="card-title brown">${dish.dish_name}</h5>
//                     <p class="card-text text-muted small">${dish.category}</p>
//                     <a href="dishView.html?id=${dish.id}" class="btn buttonOrange w-100">View Recipe</a>
//                 </div>
//             </div>
//         </div>
//     `).join('');
// }



document.addEventListener('DOMContentLoaded', () => {
    // 1. Check if we are on the search page
    const dishListContainer = document.getElementById('dishList');
    const pageSearchInput = document.getElementById('searchInput');

    if (dishListContainer) {
        // 2. Get the search term from the URL (e.g., ?q=bagnet)
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');

        if (query) {
            // Fill the page search input with the current query
            if (pageSearchInput) pageSearchInput.value = query;
            // Run the search
            performDatabaseSearch(query);
        }
    }
});

// The function that talks to your MySQL backend
function performDatabaseSearch(query) {
    const dishList = document.getElementById('dishList');
    
    fetch(`http://localhost:3000/api/search-dishes?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            renderSearchCards(data);
        })
        .catch(err => console.error("Search error:", err));
}

// Function to generate the HTML cards
function renderSearchCards(dishes) {
    const dishList = document.getElementById('dishList');
    
    if (dishes.length === 0) {
        dishList.innerHTML = '<div class="col-12 text-center mt-5"><h3>No dishes found. Try a different keyword!</h3></div>';
        return;
    }

    dishList.innerHTML = dishes.map(dish => {
        // --- 1. LOGIC FOR DESIGN UPDATES ---
        const rating = dish.avg_rating ? Number(dish.avg_rating).toFixed(1) : "0.0";
        
        // This is the line that fixes your design issue!
        const isFav = Number(dish.isFavorite); 
        const favoriteClass = isFav > 0 ? 'fa-solid' : 'fa-regular';

        return `
        <div class="col-sm-12 col-lg-4 mb-3 dish">
            <a href="dishView.html?id=${dish.id}" class="text-decoration-none text-dark">
                <div class="card rounded-4 border-0 shadow img-wrapper h-100">
                    <div class="position-relative">
                        <img src="http://localhost:3000/DishFiles/img/${dish.image_path}" class="card-img-top rounded-top-4" alt="${dish.dish_name}" style="height:200px; object-fit:cover;">
                        <div class="position-absolute top-0 end-0 m-2 d-flex gap-2">
                            <div class="bg-white px-2 rounded-4 shadow-sm d-flex align-items-center">
                                <i class="fa-solid fa-star" style="color: rgb(255, 212, 59);"></i>&nbsp;${rating}
                            </div>
                            <button class="btn btn-light rounded-circle shadow-sm save-btn" data-id="${dish.id}">
                                <i class="${favoriteClass} fa-bookmark" style="color: #ff6d05;"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${dish.dish_name}</h5>
                        <p class="card-text gray clamp-2">${dish.description || 'No description available.'}</p>
                        <hr>
                        <div class="d-flex">
                            <i class="fa-regular fa-clock gray pt-1"></i>
                            <p class="gray me-3">&nbsp;${dish.prep_time || '--'}</p>
                            <i class="fa-solid fa-user-group gray pt-1"></i>
                            <p class="gray">&nbsp;${dish.servings || '--'} Servings</p>
                        </div>
                    </div>
                </div>
            </a>
        </div>`;
    }).join('');
}

// Support for the "onkeyup" in your search.html input
let searchTimer; 

function searchDish() {
    clearTimeout(searchTimer); // Reset the timer every time a key is pressed
    const query = document.getElementById('searchInput').value.trim();

    searchTimer = setTimeout(() => {
        if (query.length >= 2) {
            performDatabaseSearch(query);
        }
    }, 300); // Wait 300ms after the last keystroke
}


//-------------------------------- INITIALIZATION --------------------------------
// This runs everything once when the page is ready

////// SIGN UP///////////////////////

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
      const res = await fetch("http://localhost:3000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email, password })
      });

      const data = await res.json();

      if (data.success) {
          alert("Signup successful! Redirecting to login...");
          // This "clears" the boxes by moving to the next page
          window.location.href = "login.html"; 
      } else {
          alert(data.message || "Signup failed");
      }

    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  });
}
///////////////////// loginnnn ////////

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // ✅ ADD THIS
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        // Save user info for UI only
        localStorage.setItem("user", data.user.email);
        localStorage.setItem("userName", data.user.fullname);

        alert("Welcome back, " + data.user.fullname);
        window.location.href = "index.html";
      }else {
        alert(data.message || "Invalid credentials");
      }

    } catch (err) {
      console.error("LOGIN ERROR:", err);
      alert("Could not connect to server. Is your Node.js running?");
    }
  });
}




///// log out and etc


function updateNavbarAuth() {
    const authBtn = document.querySelector(".buttonOrange");
    const accountMenu = document.getElementById("accountMenu");
    const accountModal = document.getElementById("accountModal");
    
    const userEmail = localStorage.getItem("user");
    const fullName = localStorage.getItem("userName");

    if (userEmail && fullName) {
        // 1. Cut the name to just the first word
        const firstName = fullName.split(" ")[0];
        authBtn.textContent = firstName;

        // 2. Remove the redirect and add click logic
        authBtn.onclick = function(e) {
            e.stopPropagation(); // Prevents immediate closing
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                accountModal.style.display = "flex";
            } else {
                // Toggle the desktop menu
                const isVisible = accountMenu.style.display === "block";
                accountMenu.style.display = isVisible ? "none" : "block";
            }
        };
    } else {
        // Reset to default Login state
        authBtn.textContent = "Login";
        authBtn.onclick = () => window.location.href = 'login.html';
    }
}

// Global Logout Function
async function handleLogout() {
    try {
        await fetch("http://localhost:3000/auth/logout", {
            method: "POST",
            credentials: "include"
        });
    } catch (err) {
        console.error(err);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
}

// Close mobile modal
function closeModal() {
    document.getElementById("accountModal").style.display = "none";
}

// Close menus if user clicks outside
document.addEventListener("click", (e) => {
    const accountMenu = document.getElementById("accountMenu");
    const authBtn = document.querySelector(".buttonOrange");
    
    if (accountMenu && !authBtn.contains(e.target) && !accountMenu.contains(e.target)) {
        accountMenu.style.display = "none";
    }
});

// Run on load and attach logout listeners
document.addEventListener("DOMContentLoaded", () => {
    updateNavbarAuth();
    
    const logoutBtn = document.getElementById("logoutBtn");
    const modalLogout = document.getElementById("modalLogout");

    if(logoutBtn) logoutBtn.onclick = handleLogout;
    if(modalLogout) modalLogout.onclick = handleLogout;

    const logoutMainBtn = document.getElementById("logoutMainBtn");

    if (logoutMainBtn) {
    logoutMainBtn.onclick = handleLogout;
    }
});

///// account edit

// 1. Function to Load and Display User Data
async function loadProfileData() {
    const currentEmail = localStorage.getItem("user");
    
    if (!currentEmail) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/auth/me", {
            credentials: "include"
        });
        
        // Check if the response is actually JSON
        if (!res.ok) throw new Error("User not found or server error");
        
        const user = await res.json();

        if (user) {
            // Fill Input Boxes
            document.getElementById("profileFullName").value = user.fullname || "";
            document.getElementById("profileUsername").value = user.username || "";
            document.getElementById("profileEmail").value = user.email || "";
            document.getElementById("profilePhone").value = user.phone || "";

            // Update Header Text (Name and @username)
            const headerName = document.querySelector(".fs-5.fw-bold");
            const headerUser = document.querySelector(".fs-5.fw-bold + p");
            
            if (headerName) headerName.textContent = user.fullname;
            if (headerUser) headerUser.textContent = `@${user.username || 'username'}`;


            // ✅ Update email display in verification section
            const emailDisplay = document.querySelectorAll(".tentwelve")[0];
            if (emailDisplay) {
                emailDisplay.textContent = user.email || "No email";
            }

            // ✅ Update phone display in verification section
            const phoneDisplay = document.querySelectorAll(".tentwelve")[1];
            if (phoneDisplay) {
                phoneDisplay.textContent = user.phone ? user.phone : "No phone number added";
            }

            // Update Joined Date
            if (user.created_at) {
                const date = new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                });
                // Finds the <p> tag inside the d-flex that contains the calendar icon
                const joinedText = document.querySelector(".fa-calendar").closest('.d-flex').querySelector('p');
                if (joinedText) joinedText.textContent = `Joined ${date}`;
            }
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }
}

// 2. Function to Save Updated Data
async function handleSaveProfile() {
    const fullname = document.getElementById("profileFullName").value.trim();
    const username = document.getElementById("profileUsername").value.trim();
    const phone = document.getElementById("profilePhone").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmNewPassword").value;
    const email = document.getElementById("profileEmail").value.trim();

    const emailInput = document.getElementById("profileEmail");

    if (!emailInput.checkValidity()) {
        alert("Please enter a valid email address!");
        emailInput.focus();
        return;
    }

    const email2 = emailInput.value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email2)) {
        alert("Invalid email format!");
        return;
    }

    // ✅ REQUIRED CHECK
    if (!fullname || !username || !document.getElementById("profileEmail").value.trim()) {
    alert("Full Name, Username, and Email are required!");
    return;
}

    if (phone) {
        const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");
        const phoneRegex = /^\+?[1-9]\d{6,14}$/; 
        if (!phoneRegex.test(cleanedPhone)) {
            alert("Invalid phone number format! Use +[CountryCode][Number]");
            return;
        }
    }


    // ✅ PASSWORD VALIDATION (optional)
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
    }

    const payload = {
        fullname,
        username,
        email,
        phone,
        ...(newPassword && { password: newPassword })
    };


    try {
        const res = await fetch("http://localhost:3000/auth/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            alert("Profile updated successfully!");
            location.reload();
        } else {
            alert(data.message || "Update failed");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}

// 3. Initialize on Page Load
document.addEventListener("DOMContentLoaded", () => {
    // Check if we are specifically on the profile page
    if (window.location.pathname.includes("profile.html")) {
        loadProfileData();

        const saveBtn = document.getElementById("saveProfileBtn");
        if (saveBtn) {
            saveBtn.onclick = handleSaveProfile; // Using .onclick to ensure only one listener
        }
    }
});

// document.querySelectorAll(".save-btn").forEach(button => {
//     button.addEventListener("click", async function (e) {
//         e.preventDefault();
//         e.stopPropagation();

//         const card = this.closest(".dish-card");
//         const dishId = card.dataset.id;

//         try {
//             const res = await fetch("http://localhost:3000/dishes/save", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 credentials: "include",
//                 body: JSON.stringify({ dishId })
//             });

//             const data = await res.json();
//             const icon = this.querySelector("i");

//             if (data.saved) {
//                 icon.classList.remove("fa-regular");
//                 icon.classList.add("fa-solid");
//             } else {
//                 icon.classList.remove("fa-solid");
//                 icon.classList.add("fa-regular");
//             }

//         } catch (err) {
//             console.error(err);
//         }
//     });
// });

// -------------------------------- DYNAMIC FORM FIELDS --------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const ingredientsContainer = document.getElementById("ingredientsContainer");
    const addIngredientBtn = document.getElementById("addIngredientBtn");
    const stepsContainer = document.getElementById("stepsContainer");
    const addStepBtn = document.getElementById("addStepBtn");

   // --- ADD INGREDIENT ---
    if (addIngredientBtn) {
        addIngredientBtn.onclick = () => {
            // Count how many rows currently exist (including the first one)
            const currentCount = ingredientsContainer.querySelectorAll(".ingredient-row").length;
            const nextNumber = currentCount + 1; // This will be 2 if 1 exists
            
            const newRow = document.createElement("div");
            newRow.className = "d-flex ingredient-row";
            newRow.innerHTML = `
                <input type="text" name="ingredients[]" class="form-control mb-2" placeholder="ingredient ${nextNumber}" required>
                <button type="button" class="border border-0 mb-2 p-2 bg-white remove-btn">
                    <i class="fa-regular fa-trash-can" style="color: rgb(251, 0, 0);"></i>
                </button>
            `;
            ingredientsContainer.appendChild(newRow);
        };
    }

    // --- ADD STEP ---
    if (addStepBtn) {
        addStepBtn.addEventListener('click', function() {
            // Count how many steps already exist to get the next number
            const nextStep = document.querySelectorAll('.step-item').length + 1;

            const newStep = document.createElement("div");
            newStep.className = "border rounded-3 mt-3 p-3 step-item";
            
            newStep.innerHTML = `
                <div class="d-flex align-items-center p-2">
                    <h6 class="mb-0 brown">Step ${nextStep}</h6>
                    <button type="button" class="border-0 bg-white ms-auto remove-btn">
                        <i class="fa-regular fa-trash-can" style="color:red;"></i>
                    </button>
                </div>
                <input type="text" name="stepTitles[]" class="form-control mb-2" placeholder="Step title" required> 
                <textarea name="stepDescriptions[]" class="form-control" rows="3" placeholder="Description" required></textarea>
            `;

            stepsContainer.appendChild(newStep);
        });
    }

    // --- SHARED DELETE LOGIC ---
    // We use "Event Delegation" so it works even for buttons created after the page loads
    document.addEventListener("click", (e) => {
        if (e.target.closest(".remove-btn")) {
            const row = e.target.closest(".ingredient-row") || e.target.closest(".step-item");
            if (row) {
                row.remove();
                reorderAll(); // Fix the "Step 1, Step 2" numbering
            }
        }
    });

    // Function to keep step numbers (1, 2, 3...) correct after a deletion
    function reorderAll() {
        const ingredientsContainer = document.getElementById("ingredientsContainer");
        const stepsContainer = document.getElementById("stepsContainer");

        // Fix Ingredient Placeholders (1, 2, 3...)
        const ingredientInputs = ingredientsContainer.querySelectorAll(".ingredient-row input");
        ingredientInputs.forEach((input, index) => {
            input.placeholder = `ingredient ${index + 1}`;
        });

        // Fix Step Titles (Step 1, Step 2...)
        const stepHeaders = stepsContainer.querySelectorAll(".step-item h6");
        stepHeaders.forEach((header, index) => {
            header.textContent = `Step ${index + 1}`;
        });
    }


    
});

// 1. Wait for the page to load
document.addEventListener('DOMContentLoaded', () => {
    
    const addDishForm = document.getElementById('addDishForm');

    // 2. Attach the Listener to the Form
    if (addDishForm) {
        addDishForm.addEventListener('submit', function (event) {
            // Stop the page from refreshing/reloading
            event.preventDefault(); 
            

            // 3. Check if all "required" fields are filled
            if (!addDishForm.checkValidity()) {
                event.stopPropagation();
                console.log("Validation failed. Check the red boxes in the UI.");
            } else {
                // 4. Success! Now collect the data
                const finalData = collectFormData();
                
                // 5. Look at the Console (F12) to see this!
                console.log("--- DISH SAVED SUCCESSFULLY ---");
                console.log(finalData); 

                alert("Success! " + finalData.dishName + " has been collected.");
            }

            // Tell Bootstrap to show the red/green colors
            addDishForm.classList.add('was-validated');
        }, false);
    }
});

// 6. The Helper Function (Keep this outside the listener)
function collectFormData() {
    return {
        dishName: document.getElementById('dishName').value,
        category: document.getElementById('category').value,
        dishHistory: document.getElementById('dishHistory').value,
        phonetic: document.getElementById('phonetic').value,
        prep_time: document.getElementById('prep_time').value,  
        cooking_time: document.getElementById('cooking_time').value, 
        servings: document.getElementById('servings').value,    
        cooking_methods: document.getElementById('cooking_methods').value, 
        
        ingredients: Array.from(document.querySelectorAll('input[name="ingredients[]"]'))
            .map(input => input.value)
            .filter(val => val.trim() !== ""),

        steps: Array.from(document.querySelectorAll('.step-item')).map(step => {
            return {
                title: step.querySelector('input[name="stepTitles[]"]').value,
                description: step.querySelector('textarea[name="stepDescriptions[]"]').value
            };
        }).filter(s => s.title.trim() !== "" || s.description.trim() !== "")
    };
}

const dishImage = document.getElementById('dishImage');
const imageLabel = document.querySelector('label[for="dishImage"]');

if (dishImage) {
    dishImage.addEventListener('change', function() {
        const file = this.files[0]; // Get the first file selected
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Replace the upload icon with the actual image
                imageLabel.innerHTML = `
                    <img src="${e.target.result}" 
                         style="height: 250px; width: auto; object-fit: contain;">
                    <p class="mt-2 text-success"><i class="fa-solid fa-check-circle"></i> Image Loaded</p>
                `;
                imageLabel.style.border = "2px solid #198754"; // Turn border green
            };
            
            reader.readAsDataURL(file);
            console.log("Photo metadata received:", file.name, file.size + " bytes");
        }
    });
}

const cancelBtn = document.getElementById('cancelBtn');
if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        if(confirm("Are you sure? Your changes will not be saved.")) {
            window.location.href = "index.html";
        }
    });
}

 const saveDishBtn = document.getElementById("saveDishBtn")

if (saveDishBtn) {
    saveDishBtn.addEventListener('click', async function(e) {
        e.preventDefault(); 

        const formData = new FormData();
        
        // 1. Get the basic text data
        formData.append('dishName', document.getElementById('dishName').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('category', document.getElementById('category').value);
        formData.append('dishHistory', document.getElementById('dishHistory').value);
        formData.append('phonetic', document.getElementById('phonetic').value);
        formData.append('prep_time', document.getElementById('prep_time').value);
        formData.append('cooking_time', document.getElementById('cooking_time').value);
        formData.append('servings', document.getElementById('servings').value);
        formData.append('cooking_methods', document.getElementById('cooking_methods').value);
        formData.append('preparation_method', document.getElementById('preparation_method')?.value || "");
        
        // 2. Get Ingredients (using your existing logic)
        const ingredients = Array.from(document.querySelectorAll('input[name="ingredients[]"]'))
            .map(input => input.value)
            .filter(val => val.trim() !== "");
        formData.append('ingredients', JSON.stringify(ingredients)); // Send as stringified array

        // 3. Get Steps (using your existing logic)
        const steps = Array.from(document.querySelectorAll('.step-item')).map(step => {
            return {
                title: step.querySelector('input[name="stepTitles[]"]').value,
                description: step.querySelector('textarea[name="stepDescriptions[]"]').value
            };
        }).filter(s => s.title.trim() !== "" || s.description.trim() !== "");
        formData.append('steps', JSON.stringify(steps)); // Send as stringified array

        // 4. THE AUDIO FILE (This is the new part!)
        const audioInput = document.getElementById('audioFile'); 
        if (audioInput && audioInput.files[0]) {
            formData.append('audioFile', audioInput.files[0]);
        }

        // 5. THE IMAGE FILE (Optional: if you have the image input)
        const imageInput = document.getElementById('dishImage');
        if (imageInput && imageInput.files[0]) {
            formData.append('dishImage', imageInput.files[0]);
        }

        console.log("Sending FormData to server...");

        try {
            const res = await fetch('http://localhost:3000/add-dish', {
                method: 'POST',
                body: formData, // Browser automatically handles the headers!
                credentials: 'include'
            });

            const data = await res.json();
            alert(data.message);
            // window.location.href = "index.html"; 
        } catch (err) {
            console.error("Error saving to DB:", err);
        }
    });
}

/// LOAD MENU --------------------------------

async function loadMenu(filterValue = 'all', filterType = 'category') {
    const container = document.getElementById('menu-container'); 
    if (!container) return; 

    try {
        // --- LOGIC: Decide which URL to fetch ---
        // --- Updated URL Logic for your try block ---
        let url = new URL('http://localhost:3000/get-dishes');

        if (filterValue === 'my') {
            const fullName = localStorage.getItem('userName');
            url = new URL('http://localhost:3000/api/filter-dishes');
            url.searchParams.append('fullName', fullName);
        } else if (filterValue !== 'all') {
            url = new URL('http://localhost:3000/api/filter-dishes');
            url.searchParams.append('category', filterValue); // This handles '&' safely
        }

        const response = await fetch(url, { credentials: 'include' });
        const dishes = await response.json();

        container.innerHTML = ""; 

        if (dishes.length === 0) {
            container.innerHTML = `<div class="col-12 text-center mt-5"><h3 class="gray">No dishes found here yet!</h3></div>`;
            return;
        }

        dishes.forEach(dish => {
            const rating = dish.avg_rating ? Number(dish.avg_rating).toFixed(1) : "0.0";
            const favoriteClass = dish.isFavorite > 0 ? 'fa-solid' : 'fa-regular';
            
            const cardHTML = `
                <div class="col-sm-12 col-lg-4 mb-3 d-flex"> 
                    <a href="dishView.html?id=${dish.id}" class="text-decoration-none text-dark w-100">
                        <div class="card rounded-4 border-0 shadow img-wrapper h-100" data-id="${dish.id}">
                            <div class="position-relative">
                                <img src="http://localhost:3000/DishFiles/img/${dish.image_path}" class="card-img-top rounded-top-4" alt="${dish.dish_name}">
                                <div class="position-absolute top-0 end-0 m-2 d-flex gap-2">
                                    <div class="bg-white px-2 rounded-4 shadow-sm d-flex align-items-center">
                                        <i class="fa-solid fa-star" style="color: rgb(255, 212, 59);"></i>&nbsp;${rating}
                                    </div>
                                    <button class="btn btn-light rounded-circle shadow-sm save-btn" data-id="${dish.id}">
                                        <i class="${favoriteClass} fa-bookmark" style="color: #ff6d05;"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${dish.dish_name}</h5>
                                <p class="card-text gray clamp-2">${dish.description}</p>
                                <div class="mt-auto">
                                    <hr>
                                    <div class="d-flex">
                                        <i class="fa-regular fa-clock gray pt-1"></i>
                                        <p class="gray me-3">&nbsp;${dish.prep_time}</p>
                                        <i class="fa-solid fa-user-group gray pt-1"></i>
                                        <p class="gray">&nbsp;${dish.servings}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>`;
            container.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Failed to load menu:", error);
    }

    // --- FAVORITE TOGGLE LOGIC (Remains exactly as you wrote it) ---
    // We only attach this once to the container
    if (!container.dataset.listenerAttached) {
        container.addEventListener('click', function(e) {
            const btn = e.target.closest('.save-btn');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();

            const dishId = btn.getAttribute('data-id');
            const icon = btn.querySelector('i');

            fetch('http://localhost:3000/api/toggle-favorite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dish_id: dishId }),
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (data.status === 'added') {
                        icon.classList.replace('fa-regular', 'fa-solid');
                    } else {
                        icon.classList.replace('fa-solid', 'fa-regular');
                    }
                } else {
                    alert("Please log in to save recipes!");
                    window.location.href = 'login.html';
                }
            })
            .catch(err => console.error("Error toggling favorite:", err));
        });
        container.dataset.listenerAttached = "true";
    }
}

// 2. The Apply Filter Helper
function applyFilter(element, category) {
    // 1. UI: Remove orange from all buttons, then add to the clicked one
    const allBtns = document.querySelectorAll('.category-btn');
    allBtns.forEach(btn => {
        btn.classList.remove('buttonOrange', 'text-white');
        btn.classList.add('btn-light', 'text-black');
    });

    element.classList.add('buttonOrange', 'text-white');
    element.classList.remove('btn-light', 'text-black');

    // 2. Logic: Let loadMenu handle the URL building and card rendering
    // This keeps search and category filtering completely separate!
    loadMenu(category);
}


document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for the 'user' key instead of 'isLoggedIn'
    const userEmail = localStorage.getItem('user'); 
    
    const myRecipesBtn = document.getElementById('myRecipesBtn');

    // 2. If userEmail is not null, the user is logged in
    if (userEmail && myRecipesBtn) {
        console.log("Found user:", userEmail, "- Showing My Recipes button.");
        myRecipesBtn.classList.remove('d-none');
    } else {
        console.log("No user found in localStorage.");
    }
});




// Run this when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial load of all dishes
    loadMenu('all');

    // 2. Optional: Set the "All" button to orange by default 
    // (Assuming your "All" button has an ID or unique class)
    const allButton = document.querySelector('.category-btn[onclick*="all"]');
    if (allButton) {
        allButton.classList.add('buttonOrange', 'text-white');
        allButton.classList.remove('btn-light', 'text-black');
    }
});


