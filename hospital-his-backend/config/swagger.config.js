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
                        { name: 'page', in: 'query', schema: { type: 'integer' } },
                        { name: 'limit', in: 'query', schema: { type: 'integer' } },
                        { name: 'search', in: 'query', schema: { type: 'string' } }
                    ],
                    responses: { 200: { description: 'List of patients' } }
                },
                post: {
                    tags: ['Patients'],
                    summary: 'Register New Patient',
                    responses: { 201: { description: 'Patient created' } }
                }
            },
            '/patients/{id}': {
                get: {
                    tags: ['Patients'],
                    summary: 'Get Patient by ID',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
                    ],
                    responses: { 200: { description: 'Patient details' } }
                }
            },
            // OPD endpoints
            '/opd/appointments': {
                get: {
                    tags: ['OPD'],
                    summary: 'Get OPD Appointments',
                    responses: { 200: { description: 'List of appointments' } }
                },
                post: {
                    tags: ['OPD'],
                    summary: 'Create OPD Appointment',
                    responses: { 201: { description: 'Appointment created' } }
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
