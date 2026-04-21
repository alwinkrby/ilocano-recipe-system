const express = require("express");
const router = express.Router();

// IMPORTANT: adjust this path depending on your project structure
const db = require("../db"); 

// ---------------- SIGNUP ----------------
router.post("/signup", (req, res) => {
    const { fullname, email, password } = req.body;

    const sql = "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";

    db.query(sql, [fullname, email, password], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Signup failed"
            });
        }

        return res.json({
            success: true,
            message: "Signup successful!"
        });
    });
});


// ---------------- LOGIN ----------------
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    // 1. Search for the user by email ONLY
    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], (err, result) => {
        if (err) {
            console.log("DB Error:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        // 2. Check if a user was actually found
        if (result.length > 0) {
            const user = result[0];

            // 3. Compare the password from the DB with the one from the request
            if (user.password === password) {
                // SUCCESS: Save user info in session
                console.log("SESSION BEFORE SAVE:", req.session);

                req.session.user = {
                id: user.user_id,
                fullname: user.fullname,
                email: user.email
            };
             console.log("SESSION AFTER LOGIN:", req.session.user);
            // FORCE SESSION TO SAVE BEFORE RESPONSE
            req.session.save((err) => {
                if (err) {
                    console.log("Session save error:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Session error"
                    });
                }

                return res.json({
                    success: true,
                    message: "Login successful!",
                    user: req.session.user
                });
            });
            } else {
                // FAIL: Wrong password
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }
        } else {
            // FAIL: No user with that email
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
    });
});


//// user profile
// Check that this is inside your auth.js and matches the fetch URL
router.get("/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false });
    }

    const sql = "SELECT fullname, username, email, phone, created_at FROM users WHERE user_id = ?";

    db.query(sql, [req.session.user.id], (err, result) => {
        if (err) return res.status(500).json({ success: false });

        res.json(result[0]);
    });
});


// ---------------- UPDATE PROFILE ----------------
router.post("/update-profile", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const userId = req.session.user.id;
    const { fullname, username, email, phone, password } = req.body;

    let sql;
    let values;

    if (password) {
        sql = `
            UPDATE users 
            SET fullname = ?, username = ?, email = ?, phone = ?, password = ?
            WHERE user_id = ?
        `;
        values = [fullname, username, email, phone, password, userId];
    } else {
        sql = `
            UPDATE users 
            SET fullname = ?, username = ?, email = ?, phone = ?
            WHERE user_id = ?
        `;
        values = [fullname, username, email, phone, userId];
    }

    db.query(sql, values, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false });
        }

        res.json({ success: true });
    });
});

router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});




module.exports = router;