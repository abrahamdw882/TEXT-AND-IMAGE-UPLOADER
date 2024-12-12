const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'ab', 
    resave: false,
    saveUninitialized: true,
}));


const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, 
});


const uploads = [];


app.use(express.static(path.join(__dirname, 'public')));


app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;

    
    if (username === 'admin' && password === 'abbot') {
        req.session.isAdmin = true;
        res.status(200).json({ message: 'Login successful!' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});


function isAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
}


app.get('/uploads-data', isAdmin, (req, res) => {
    res.status(200).json(uploads);
});

app.get('/customer.html', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'customer.html'));
});


app.post('/upload', upload.single('image'), (req, res) => {
    const text = req.body.text;
    const imageFile = req.file;

    if (!text || !imageFile) {
        return res.status(400).json({ message: 'Text and image are required.' });
    }

    
    const targetPath = path.join(__dirname, 'uploads', imageFile.originalname);
    fs.rename(imageFile.path, targetPath, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving the image file.' });
        }

       
        const uploadData = {
            text,
            imageUrl: `/uploads/${imageFile.originalname}`,
        };
        uploads.push(uploadData);

        res.status(200).json({
            message: 'Upload successful!',
            data: uploadData,
        });
    });
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
