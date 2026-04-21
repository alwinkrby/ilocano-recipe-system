console.log("🔥 THIS IS THE ACTIVE SERVER FILE");


const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // '..' steps out of 'ilocano-recipe-app'
        // Then we choose 'audio' or 'img' based on the field name
        const subFolder = file.fieldname === "audioFile" ? "audio" : "img";
        const finalPath = path.join(__dirname, "..", "DishFiles", subFolder);
        
        cb(null, finalPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });


const express = require("express");
const mysql = require('mysql2');
const cors = require("cors");
const app = express();
const session = require("express-session");



// ---------------- ROUTES ----------------
const authRoutes = require("./routes/auth");

// ---------------- MIDDLEWARE ----------------

// CLEAN CORS (ONLY ONCE)
app.use(cors({
    origin: "http://localhost:5500", // Must match your frontend URL exactly
    credentials: true                // Allows cookies/sessions to be sent
}));


app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "ilocos-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "lax"
    }
}));

//-------------------------------------- INSERT DISH ------------------------------------------------------



// This defines "db" so the rest of your code knows where to send the data
// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',      // Default XAMPP username
//     password: '',      // Default XAMPP password is empty
//     database: 'ilocano_recipes' // Ensure this matches the DB name in phpMyAdmin
// });

const db = require('./db'); // This imports your connection from db.js
// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});



// ONE ROUTE TO RULE THEM ALL
// Use upload.fields to allow both image and audio files
app.post('/add-dish', upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'dishImage', maxCount: 1 }
]), (req, res) => {

    const audioPath = req.files['audioFile'] ? req.files['audioFile'][0].filename : null;
    const imagePath = req.files['dishImage'] ? req.files['dishImage'][0].filename : null;
    
    // 1. Get text fields
    const { 
        dishName, 
        description,
        category, 
        dishHistory,
        phonetic, 
        prep_time, 
        cooking_time, 
        servings, 
        cooking_methods,
        preparation_method
    } = req.body;
    
    // 2. Parse the stringified arrays from FormData
    let ingredients = [];
    let steps = [];
    try {
        ingredients = JSON.parse(req.body.ingredients || "[]");
        steps = JSON.parse(req.body.steps || "[]");
    } catch (e) {
        console.error("Parsing error:", e);
    }

    // 3. Capture the filenames from Multer
    // req.files is an object containing arrays for each field
    

    const authorName = (req.session.user && req.session.user.fullname) 
                       ? req.session.user.fullname 
                       : "Anonymous";

    // 4. SQL Insert (Ensure you have 6 columns and 6 question marks)
    const dishQuery = "INSERT INTO dishes (dish_name, description, category, dish_history, phonetic, prep_time, cooking_time, servings, cooking_methods, preparation_method, image_path, audio_path, added_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    db.query(dishQuery, [
        dishName,
        description,   
        category, 
        dishHistory,
        phonetic,  
        prep_time,      
        cooking_time,   
        servings,       
        cooking_methods, 
        preparation_method,
        imagePath,       
        audioPath,        
        authorName        
    ], (err, result) => {
        if (err) {
            console.error("❌ SQL ERROR:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage }); 
        }

        const newDishId = result.insertId;

        // Bulk insert ingredients
        if (ingredients.length > 0) {
            const ingredientData = ingredients.map(ing => [newDishId, ing]);
            db.query("INSERT INTO ingredients (dish_id, ingredient_name) VALUES ?", [ingredientData]);
        }

        // Bulk insert steps
        if (steps.length > 0) {
            const stepData = steps.map(s => [newDishId, s.title, s.description]);
            db.query("INSERT INTO steps (dish_id, step_title, step_description) VALUES ?", [stepData], (stepErr) => {
                if (stepErr) return res.status(500).json({ error: "Steps failed" });
                res.json({ success: true, message: "Success! Recipe, Image, and Audio saved." });
            });
        } else {
            res.json({ success: true, message: "Dish saved!" });
        }
    });
});

// This route fetches all dishes from the database to display on your menu
app.get('/get-dishes', (req, res) => {
    // 1. Get the User ID from the session (if they are logged in)
    console.log("Session User Data:", req.session.user); // <--- ADD THIS
    const userId = (req.session.user && (req.session.user.user_id || req.session.user.id)) || 0;
    console.log("Using User ID for SQL:", userId); // <--- ADD THIS

    // 2. The SQL checks if a row exists in the favorites table for THIS user
    const sql = `
        SELECT 
            d.*, 
            IFNULL(AVG(r.rating), 0) AS avg_rating,
            (SELECT COUNT(*) FROM favorites WHERE user_id = ? AND dish_id = d.id) AS isFavorite,
            GROUP_CONCAT(DISTINCT i.ingredient_name SEPARATOR '\n') AS ingredients
        FROM dishes d
        LEFT JOIN reviews r ON d.id = r.dish_id
        LEFT JOIN ingredients i ON d.id = i.dish_id
        GROUP BY d.id
        ORDER BY d.created_at DESC`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to fetch dishes" });
        }
        res.json(results);
    });
});

// FETCH A SINGLE DISH WITH ITS INGREDIENTS AND STEPS
// app.get('/api/dish/:id', (req, res) => {
//     const dishId = req.params.id;

//     const dishSql = "SELECT * FROM dishes WHERE id = ?";
//     db.query(dishSql, [dishId], (err, dishResults) => {
//         if (err || dishResults.length === 0) {
//             return res.status(404).json({ error: "Dish not found" });
//         }

//         const dish = dishResults[0];

//         const ingSql = "SELECT ingredient_name FROM ingredients WHERE dish_id = ?";
//         db.query(ingSql, [dishId], (err, ingResults) => {
            
//             const stepSql = "SELECT step_title, step_description FROM steps WHERE dish_id = ? ORDER BY id ASC";
//             db.query(stepSql, [dishId], (err, stepResults) => {
                
//                 // --- NEW: Query 4: Get reviews with user names ---
//                 const reviewSql = `
//                     SELECT r.*, u.fullname 
//                     FROM reviews r 
//                     JOIN users u ON r.user_id = u.user_id 
//                     WHERE r.dish_id = ? 
//                     ORDER BY r.created_at DESC`;

//                 db.query(reviewSql, [dishId], (err, reviewResults) => {
//                     if (err) {
//                         return res.status(500).json({ error: "Failed to fetch reviews" });
//                     }

//                     // Send everything back, including the reviews array
//                     res.json({
//                         dish: dish,
//                         ingredients: ingResults,
//                         steps: stepResults,
//                         reviews: reviewResults, // This is what the frontend is waiting for!
//                         isLoggedIn: req.session.user ? true : false,
//                         currentUserId: req.session.user ? (req.session.user.user_id || req.session.user.id) : null
//                     });
//                 });
//                 // --- END NEW QUERY ---
//             });
//         });
//     });
// });


app.get('/api/dish/:id', (req, res) => {
    const dishId = req.params.id;
    const userId = req.session.user ? (req.session.user.user_id || req.session.user.id) : null;

    // 1. Get the Dish details
    db.query("SELECT * FROM dishes WHERE id = ?", [dishId], (err, dishResults) => {
        if (err || dishResults.length === 0) return res.status(404).json({ error: "Dish not found" });

        const dish = dishResults[0];

        // 2. Get Ingredients
        db.query("SELECT ingredient_name FROM ingredients WHERE dish_id = ?", [dishId], (err, ingResults) => {
            
            // 3. Get Steps
            db.query("SELECT step_title, step_description FROM steps WHERE dish_id = ? ORDER BY id ASC", [dishId], (err, stepResults) => {
                
                // 4. Get Reviews (Joining users to get the name)
                const reviewSql = `
                    SELECT r.*, u.fullname 
                    FROM reviews r 
                    JOIN users u ON r.user_id = u.user_id 
                    WHERE r.dish_id = ? 
                    ORDER BY r.created_at DESC`;

                db.query(reviewSql, [dishId], (err, reviewResults) => {

                    // 5. Check if Favorite (Only if logged in)
                    if (!userId) {
                        // User not logged in? Send back false for favorite status
                        return res.json({
                            dish: dish,
                            ingredients: ingResults,
                            steps: stepResults,
                            reviews: reviewResults,
                            isLoggedIn: false,
                            isFavorite: false
                        });
                    }

                    const favSql = "SELECT * FROM favorites WHERE user_id = ? AND dish_id = ?";
                    db.query(favSql, [userId, dishId], (err, favoriteResults) => {
                        if (err) return res.status(500).json({ error: "Favorite check failed" });

                        // THE FINAL COMPLETE RESPONSE
                        res.json({
                            dish: dish,
                            ingredients: ingResults,
                            steps: stepResults,
                            reviews: reviewResults,
                            isLoggedIn: true,
                            isFavorite: favoriteResults.length > 0
                        });
                    });
                });
            });
        });
    });
});

app.post('/api/toggle-favorite', (req, res) => {
    // 1. Check if user is logged in
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Please log in" });
    }

    const { dish_id } = req.body;
    const user_id = req.session.user.user_id || req.session.user.id;

    // 2. Check if it already exists in the table
    const checkSql = "SELECT * FROM favorites WHERE user_id = ? AND dish_id = ?";
    db.query(checkSql, [user_id, dish_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });

        if (results.length > 0) {
            // It exists, so REMOVE it (Unsave)
            const deleteSql = "DELETE FROM favorites WHERE user_id = ? AND dish_id = ?";
            db.query(deleteSql, [user_id, dish_id], (err) => {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true, status: 'removed' });
            });
        } else {
            // It doesn't exist, so ADD it (Save)
            const insertSql = "INSERT INTO favorites (user_id, dish_id) VALUES (?, ?)";
            db.query(insertSql, [user_id, dish_id], (err) => {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true, status: 'added' });
            });
        }
    });
});

app.get('/api/my-favorites', (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false });

    // Try both naming conventions just in case
    const userId = req.session.user.user_id || req.session.user.id;

    // Simplified query to test connection first
    const sql = `
        SELECT 
            d.*, 
            IFNULL(AVG(r.rating), 0) as avg_rating
        FROM favorites f
        JOIN dishes d ON f.dish_id = d.id
        LEFT JOIN reviews r ON d.id = r.dish_id
        WHERE f.user_id = ?
        GROUP BY d.id`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("SQL ERROR:", err); // Look at your terminal for the red text!
            return res.status(500).json({ success: false, message: "Database query failed" });
        }
        res.json(results);
    });
});



///Comments
app.post('/api/add-review', (req, res) => {
    // 1. Security check: Is the user logged in?
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Please log in first." });
    }

    const { dish_id, rating, comment } = req.body;
    const user_id = req.session.user.user_id || req.session.user.id; // Using your table's user_id column
    
    // DEBUG: This will print to your terminal so you can see if it's still null
    console.log("Current User ID from session:", user_id);

    if (!user_id) {
        return res.status(400).json({ success: false, message: "User ID missing from session." });
    }


    const sql = "INSERT INTO reviews (dish_id, user_id, rating, comment) VALUES (?, ?, ?, ?)";
    
    
    db.query(sql, [dish_id, user_id, rating, comment], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error." });
        }
        res.json({ success: true, message: "Review added successfully!" });
    });
});

app.use('/DishFiles', express.static('../DishFiles'));


///// DELETE COMMENT--------------------------
app.delete('/api/delete-review/:id', (req, res) => {
    const reviewId = req.params.id;
    const userId = req.session.user.user_id || req.session.user.id;

    // We check BOTH the review_id AND the user_id for security
    const sql = "DELETE FROM reviews WHERE review_id = ? AND user_id = ?";
    
    db.query(sql, [reviewId, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false });
        
        if (result.affectedRows === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        
        res.json({ success: true });
    });
});

// Add a dish to the user's grocery list
app.post('/api/add-to-grocery', (req, res) => {
    const userId = req.session.user?.id || req.session.user?.user_id;
    const { dishId } = req.body;

    if (!userId) return res.status(401).json({ error: "Please log in first" });

    const sql = "INSERT IGNORE INTO grocery_list (user_id, dish_id) VALUES (?, ?)";
    db.query(sql, [userId, dishId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Remove a dish when completed
app.post('/api/remove-from-grocery', (req, res) => {
    const userId = req.session.user?.id || req.session.user?.user_id;
    const { dishId } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const sql = "DELETE FROM grocery_list WHERE user_id = ? AND dish_id = ?";
    db.query(sql, [userId, dishId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        // Always send a JSON response back!
        res.json({ success: true }); 
    });
});

app.get('/api/my-grocery-list', (req, res) => {
    const userId = req.session.user?.id || req.session.user?.user_id;
    
    if (!userId) {
        return res.status(401).json({ error: "User not logged in" });
    }

    const sql = `
        SELECT d.*, GROUP_CONCAT(DISTINCT i.ingredient_name SEPARATOR '\n') AS ingredients
        FROM grocery_list gl
        JOIN dishes d ON gl.dish_id = d.id
        LEFT JOIN ingredients i ON d.id = i.dish_id
        WHERE gl.user_id = ?
        GROUP BY d.id`;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});


app.get('/api/search-dishes', (req, res) => {
    // Correctly get the ID from your session object structure
    const userId = (req.session.user && (req.session.user.user_id || req.session.user.id)) || 0;
    const searchTerm = `%${req.query.q}%`;

    const sql = `
        SELECT 
            d.*, 
            IFNULL(ROUND(AVG(r.rating), 1), 0.0) AS avg_rating,
            (SELECT COUNT(*) FROM favorites f WHERE f.dish_id = d.id AND f.user_id = ?) AS isFavorite
        FROM dishes d
        LEFT JOIN reviews r ON d.id = r.dish_id
        WHERE d.dish_name LIKE ? OR d.category LIKE ?
        GROUP BY d.id
        LIMIT 12`;

    // We pass userId first to match the first '?' in the subquery
    db.query(sql, [userId, searchTerm, searchTerm], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


app.get('/api/filter-dishes', (req, res) => {
    const { category, fullName } = req.query;
    // Fix: Match the session structure used in /get-dishes
    const userId = (req.session.user && (req.session.user.user_id || req.session.user.id)) || 0;

    let sql = `
        SELECT d.*, 
        IFNULL(ROUND(AVG(r.rating), 1), 0.0) AS avg_rating,
        (SELECT COUNT(*) FROM favorites f WHERE f.dish_id = d.id AND f.user_id = ?) AS isFavorite
        FROM dishes d
        LEFT JOIN reviews r ON d.id = r.dish_id`;

    let params = [userId];

    if (fullName) {
        sql += ` WHERE d.added_by = ? GROUP BY d.id`;
        params.push(fullName);
    } else {
        sql += ` WHERE d.category = ? GROUP BY d.id`;
        params.push(category);
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ---------------- ROUTES ----------------
app.use("/auth", authRoutes);
app.use((req, res, next) => {
    console.log("REQUEST ORIGIN:", req.headers.origin);
    next();
});
// ---------------- START ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
// app.listen(3000, () => {
//     console.log("🚀 Server running on http://localhost:3000");
// });

