const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HIS Agentic - Hospital Information System API',
            version: '1.0.0',
            description: `
## Overview
Complete REST API documentation for the Hospital Information System (HIS) Agentic backend.

## Features
- **Patient Management**: Registration, EMR, appointments
- **OPD/IPD Management**: Outpatient and inpatient workflows
- **Emergency Services**: Real-time emergency dashboard
- **Pharmacy & Lab**: Medicine dispensing, lab orders and reports
- **Billing & Insurance**: Invoicing, payments, pre-authorization
- **AI Agents**: Inventory reorder agent, Insurance pre-auth agent

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Base URL
- **Production**: https://your-backend.hf.space/api/v1
- **Development**: http://localhost:7860/api/v1
            `
        },
        servers: [
            { url: '/api/v1', description: 'API v1' },
            { url: '/api', description: 'Base API' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Patients', description: 'Patient management' },
            { name: 'OPD', description: 'Outpatient department' },
            { name: 'IPD', description: 'Inpatient department' },
            { name: 'Emergency', description: 'Emergency services' },
            { name: 'Pharmacy', description: 'Pharmacy and medicines' },
            { name: 'Lab', description: 'Laboratory services' },
            { name: 'Radiology', description: 'Radiology services' },
            { name: 'Billing', description: 'Billing and payments' },
            { name: 'Insurance', description: 'Insurance and pre-auth' },
            { name: 'Inventory', description: 'Inventory management' },
            { name: 'Staff', description: 'Staff management' },
            { name: 'Admin', description: 'Administrative functions' },
            { name: 'AI Agents', description: 'Agentic workflows' }
        ],
        paths: {
            // Auth endpoints
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'User Login',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', example: 'admin@hospital-his.com' },
                                        password: { type: 'string', example: 'Admin@123' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Login successful' },
                        401: { description: 'Invalid credentials' }
                    }
                }
            },
            '/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Get current user profile',
                    responses: { 200: { description: 'User profile' } }
                }
            },
            // Patient endpoints
            '/patients': {
                get: {
                    tags: ['Patients'],
                    summary: 'Get All Patients',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
                        { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Results per page' },
                        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name, phone, or patient ID' }
                    ],
                    responses: { 200: { description: 'List of patients' } }
                },
                post: {
                    tags: ['Patients'],
                    summary: 'Register New Patient',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phone'],
                                    properties: {
                                        firstName: { type: 'string', example: 'John' },
                                        lastName: { type: 'string', example: 'Doe' },
                                        dateOfBirth: { type: 'string', format: 'date', example: '1990-05-15' },
                                        gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
                                        phone: { type: 'string', example: '9876543210' },
                                        email: { type: 'string', example: 'john.doe@example.com' },
                                        address: {
                                            type: 'object',
                                            properties: {
                                                street: { type: 'string', example: '123 Main Street' },
                                                city: { type: 'string', example: 'Mumbai' },
                                                state: { type: 'string', example: 'Maharashtra' },
                                                pincode: { type: 'string', example: '400001' }
                                            }
                                        },
                                        bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], example: 'O+' },
                                        emergencyContact: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string', example: 'Jane Doe' },
                                                relationship: { type: 'string', example: 'Spouse' },
                                                phone: { type: 'string', example: '9876543211' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Patient created successfully' },
                        400: { description: 'Validation error - missing required fields' }
                    }
                }
            },
            '/patients/{id}': {
                get: {
                    tags: ['Patients'],
                    summary: 'Get Patient by ID',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Patient MongoDB ID' }
                    ],
                    responses: { 200: { description: 'Patient details' } }
                },
                put: {
                    tags: ['Patients'],
                    summary: 'Update Patient',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Patient MongoDB ID' }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        firstName: { type: 'string' },
                                        lastName: { type: 'string' },
                                        phone: { type: 'string' },
                                        email: { type: 'string' },
                                        address: { type: 'object' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { 200: { description: 'Patient updated' } }
                }
            },
            '/patients/search': {
                get: {
                    tags: ['Patients'],
                    summary: 'Search Patients',
                    parameters: [
                        { name: 'query', in: 'query', required: true, schema: { type: 'string' }, description: 'Search term (name, phone, or patient ID)' }
                    ],
                    responses: { 200: { description: 'Search results' } }
                }
            },
            // OPD endpoints
            '/opd/appointments': {
                get: {
                    tags: ['OPD'],
                    summary: 'Get OPD Appointments',
                    parameters: [
                        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter by date (YYYY-MM-DD)' },
                        { name: 'doctor', in: 'query', schema: { type: 'string' }, description: 'Filter by doctor ID' },
                        { name: 'department', in: 'query', schema: { type: 'string' }, description: 'Filter by department ID' },
                        { name: 'status', in: 'query', schema: { type: 'string', enum: ['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled'] }, description: 'Filter by status' }
                    ],
                    responses: { 200: { description: 'List of appointments' } }
                },
                post: {
                    tags: ['OPD'],
                    summary: 'Create OPD Appointment',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['patient', 'doctor', 'department', 'scheduledDate'],
                                    properties: {
                                        patient: { type: 'string', description: 'Patient MongoDB ID', example: '6798...' },
                                        doctor: { type: 'string', description: 'Doctor User MongoDB ID', example: '6798...' },
                                        department: { type: 'string', description: 'Department MongoDB ID', example: '6798...' },
                                        scheduledDate: { type: 'string', format: 'date-time', example: '2026-02-05T10:00:00.000Z' },
                                        scheduledTime: { type: 'string', example: '10:00' },
                                        appointmentType: { type: 'string', enum: ['NEW', 'FOLLOWUP', 'ROUTINE'], example: 'NEW' },
                                        chiefComplaint: { type: 'string', example: 'Fever and headache' },
                                        notes: { type: 'string', example: 'Patient requested morning slot' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Appointment created' },
                        400: { description: 'Validation error' }
                    }
                }
            },
            '/opd/appointments/{id}': {
                get: {
                    tags: ['OPD'],
                    summary: 'Get Appointment by ID',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    responses: { 200: { description: 'Appointment details' } }
                },
                put: {
                    tags: ['OPD'],
                    summary: 'Update Appointment',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        scheduledDate: { type: 'string', format: 'date-time' },
                                        status: { type: 'string', enum: ['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled'] },
                                        notes: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { 200: { description: 'Appointment updated' } }
                },
                delete: {
                    tags: ['OPD'],
                    summary: 'Cancel Appointment',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    responses: { 200: { description: 'Appointment cancelled' } }
                }
            },
            '/opd/appointments/{id}/checkin': {
                put: {
                    tags: ['OPD'],
                    summary: 'Check-in Patient',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    responses: { 200: { description: 'Patient checked in' } }
                }
            },
            '/opd/queue': {
                get: {
                    tags: ['OPD'],
                    summary: 'Get OPD Queue',
                    parameters: [
                        { name: 'department', in: 'query', schema: { type: 'string' }, description: 'Filter by department' },
                        { name: 'doctor', in: 'query', schema: { type: 'string' }, description: 'Filter by doctor' }
                    ],
                    responses: { 200: { description: 'Current OPD queue' } }
                }
            },
            '/opd/dashboard': {
                get: {
                    tags: ['OPD'],
                    summary: 'Get OPD Dashboard Stats',
                    responses: { 200: { description: 'Dashboard statistics' } }
                }
            },
            // IPD endpoints
            '/ipd/admissions': {
                get: {
                    tags: ['IPD'],
                    summary: 'Get IPD Admissions',
                    responses: { 200: { description: 'List of admissions' } }
                }
            },
            // Emergency endpoints
            '/emergency': {
                get: {
                    tags: ['Emergency'],
                    summary: 'Get Emergency Cases',
                    responses: { 200: { description: 'List of emergency cases' } }
                }
            },
            // Lab endpoints
            '/lab/orders': {
                get: {
                    tags: ['Lab'],
                    summary: 'Get Lab Orders',
                    responses: { 200: { description: 'List of lab orders' } }
                }
            },
            // Pharmacy endpoints
            '/pharmacy/queue': {
                get: {
                    tags: ['Pharmacy'],
                    summary: 'Get Pharmacy Queue',
                    responses: { 200: { description: 'Pharmacy queue' } }
                }
            },
            // Billing endpoints
            '/billing/invoices': {
                get: {
                    tags: ['Billing'],
                    summary: 'Get Invoices',
                    responses: { 200: { description: 'List of invoices' } }
                }
            },
            // Insurance Pre-Auth Agent endpoints
            '/insurance/preauth-queue': {
                get: {
                    tags: ['AI Agents'],
                    summary: 'Get Pre-Auth Queue (Agentic)',
                    responses: { 200: { description: 'Pre-auth cases' } }
                },
                post: {
                    tags: ['AI Agents'],
                    summary: 'Create Pre-Auth Case',
                    responses: { 201: { description: 'Case created with auto-populated data' } }
                }
            },
            '/insurance/preauth-queue/{caseId}/generate-packet': {
                post: {
                    tags: ['AI Agents'],
                    summary: 'Generate AI Pre-Auth Packet',
                    parameters: [
                        { name: 'caseId', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    responses: { 200: { description: 'AI-generated pre-auth packet' } }
                }
            },
            // Inventory Reorder Agent endpoints
            '/inventory-manager/reorder/agent/draft': {
                post: {
                    tags: ['AI Agents'],
                    summary: 'Run Inventory Reorder Agent',
                    responses: { 200: { description: 'Draft purchase request generated' } }
                }
            },
            '/inventory-manager/draft-purchase-requests': {
                get: {
                    tags: ['AI Agents'],
                    summary: 'Get Draft Purchase Requests',
                    responses: { 200: { description: 'List of draft requests' } }
                }
            }
        }
    },
    apis: ['./routes/*.js', './server.js']
};

module.exports = swaggerJsdoc(options);
