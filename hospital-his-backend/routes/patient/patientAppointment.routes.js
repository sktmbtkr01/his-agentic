const express = require('express');
const router = express.Router();
const { authenticatePatient } = require('../../middleware/patientAuth.middleware');
const {
    getAppointments,
    getAppointmentById,
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    getDepartments,
    getDoctors,
    getAvailableSlots
} = require('../../controllers/patient/patientAppointment.controller');

router.use(authenticatePatient);

router.route('/')
    .get(getAppointments)
    .post(bookAppointment);

router.get('/departments', getDepartments);
router.get('/doctors', getDoctors);
router.get('/slots', getAvailableSlots);

router.route('/:id')
    .get(getAppointmentById)
    .put(rescheduleAppointment);

router.put('/:id/cancel', cancelAppointment);

module.exports = router;

