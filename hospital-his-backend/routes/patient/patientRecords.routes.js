const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const {
    getTimeline,
    uploadDocument,
    confirmOCR
} = require('../../controllers/patient/patientRecords.controller');

// Configure Multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/patient_docs/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images and PDF are allowed!'));
    }
});

router.use(authenticatePatient);

router.get('/timeline', getTimeline);
router.post('/upload', upload.single('file'), uploadDocument);
router.put('/ocr/:id/confirm', confirmOCR);

module.exports = router;
