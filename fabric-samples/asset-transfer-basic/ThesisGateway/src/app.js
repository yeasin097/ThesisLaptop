/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { initializeFabric, disconnectFabric } from './services/fabricService.js';
import ehrRoutes from './routes/ehrRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import researcherRoutes from './routes/researcherRoutes.js';
import cors from 'cors';

const app = express();
const port = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Initialize Fabric before starting the server
async function startServer() {
    try {
        // Initialize Fabric connection first
        await initializeFabric();
        console.log('Fabric initialization completed');

        // Routes
        app.use('/ehr', ehrRoutes);
        app.use('/patient', patientRoutes);
        app.use('/doctor', doctorRoutes);
        app.use('/researcher', researcherRoutes);

        app.get('/', (req, res) => res.send('Welcome to the EHR System'));

        // Start the server only after Fabric is initialized
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    disconnectFabric();
    process.exit();
});
