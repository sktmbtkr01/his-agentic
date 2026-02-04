import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const getAuthHeader = () => {
    const token = localStorage.getItem('patientAccessToken');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const appointmentService = {
    getAppointments: async () => {
        const response = await axios.get(`${API_URL}/patient/appointments`, getAuthHeader());
        return response.data;
    },

    getAppointmentById: async (id) => {
        const response = await axios.get(`${API_URL}/patient/appointments/${id}`, getAuthHeader());
        return response.data;
    },

    getDepartments: async () => {
        const response = await axios.get(`${API_URL}/patient/appointments/departments`, getAuthHeader());
        return response.data;
    },

    getDoctors: async (departmentId) => {
        const response = await axios.get(`${API_URL}/patient/appointments/doctors`, {
            ...getAuthHeader(),
            params: { departmentId }
        });
        return response.data;
    },

    getSlots: async (doctorId, date) => {
        const response = await axios.get(`${API_URL}/patient/appointments/slots`, {
            ...getAuthHeader(),
            params: { doctorId, date }
        });
        return response.data;
    },

    bookAppointment: async (data) => {
        const response = await axios.post(`${API_URL}/patient/appointments`, data, getAuthHeader());
        return response.data;
    },

    rescheduleAppointment: async (id, data) => {
        const response = await axios.put(`${API_URL}/patient/appointments/${id}`, data, getAuthHeader());
        return response.data;
    },

    cancelAppointment: async (id) => {
        const response = await axios.put(`${API_URL}/patient/appointments/${id}/cancel`, {}, getAuthHeader());
        return response.data;
    }
};

export default appointmentService;

