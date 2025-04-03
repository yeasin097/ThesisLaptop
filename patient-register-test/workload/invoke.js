'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class PatientRegistrationWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
        this.workerIndex = 0;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        this.workerIndex = workerIndex;
    }

    async submitTransaction() {
        this.txIndex++;
        
        // Create a sample patient data matching the citizens.json format
        const patientData = {
            name: `Test Patient ${this.txIndex}`,
            nid_no: `${5000000000 + this.txIndex}`,
            date_of_birth: this.generateRandomDate(1960, 2000),
            blood_group: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
            address: `Address ${this.txIndex}, Bangladesh`,
            father_name: `Father ${this.txIndex}`,
            phone: `019${Math.floor(10000000 + Math.random() * 90000000)}`,
            email: `patient${this.txIndex}@example.com`
        };

        // Generate hash from nid_no
        const timestamp = Date.now();
        const hash = `hash_${patientData.nid_no+timestamp}`;

        // Debug log
        console.log('Submitting transaction with args:', {
            patientData: JSON.stringify(patientData),
            hash: hash
        });

        const args = {
            contractId: 'patient',
            contractFunction: 'CreatePatient',
            contractArguments: [JSON.stringify(patientData), hash],
            invokerIdentity: 'User1',
            readOnly: false
        };

        try {
            await this.sutAdapter.sendRequests(args);
        } catch (error) {
            // Enhanced error logging
            console.error('Transaction error details:', {
                message: error.message,
                stack: error.stack,
                args: args.contractArguments
            });
            throw error;
        }
    }

    // Helper function to generate random date
    generateRandomDate(startYear, endYear) {
        const start = new Date(startYear, 0, 1);
        const end = new Date(endYear, 11, 31);
        const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return randomDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }
}

function createWorkloadModule() {
    return new PatientRegistrationWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule; 