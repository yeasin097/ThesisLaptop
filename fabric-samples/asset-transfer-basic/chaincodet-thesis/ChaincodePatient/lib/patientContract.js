'use strict';
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class PatientContract extends Contract {
    async InitLedger(ctx) {
        var ss = "contract patient initialized";
        return ss;
    }

    // CreatePatient issues a new patient record to the world state with given details.
    async CreatePatient(ctx, patient_data, hash) {
        const patientID = hash; // hash from nid_no, will serve as patient_id to find patient. 
        const exists = await this.PatientExists(ctx, patientID);
        if (exists) {
            throw new Error(`The patient ${patientID} already exists`);
        }

        await ctx.stub.putState(patientID, Buffer.from(stringify(sortKeysRecursive(patient_data))));
        return patientID;
    }

    // PatientExists checks if a patient with the given ID exists in the world state.
    async PatientExists(ctx, patientID) {
        const patientAsBytes = await ctx.stub.getState(patientID);
        return patientAsBytes && patientAsBytes.length > 0;
    }

    async GetBloodGroup(ctx, patientID) {
        const exists = await this.PatientExists(ctx, patientID);
        if (!exists) {
            throw new Error(`The patient ${patientID} does not exist`);
        }

        const patientAsBytes = await ctx.stub.getState(patientID);
        if (!patientAsBytes || patientAsBytes.length === 0) {
            throw new Error(`Patient ${patientID} does not exist`);
        }

        try {
            const patient = JSON.parse(patientAsBytes.toString('utf8'));
            if (!patient.blood_group) {
                return 'Unknown';
            }
            return patient.blood_group;
        } catch (err) {
            console.error('Error parsing patient data:', err);
            throw new Error(`Failed to parse patient data for ${patientID}`);
        }
    }

    async GetAll(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');

        let result = await iterator.next();
        while (!result.done) {
            try {
                const strValue = result.value.value.toString('utf8');
                const record = JSON.parse(strValue);
                allResults.push(record);
            } catch (err) {
                console.error("Error parsing patients", err);
            }
            result = await iterator.next();
        }

        console.info('All patients retrieved');
        return JSON.stringify(allResults);
    }

    // Add this function if it doesn't exist
    async ReadPatient(ctx, patientID) {
        const exists = await this.PatientExists(ctx, patientID);
        if (!exists) {
            throw new Error(`The patient ${patientID} does not exist`);
        }

        const patientAsBytes = await ctx.stub.getState(patientID);
        if (!patientAsBytes || patientAsBytes.length === 0) {
            throw new Error(`Patient ${patientID} does not exist`);
        }

        try {
            const patient = JSON.parse(patientAsBytes.toString('utf8'));
            return JSON.stringify(patient);
        } catch (err) {
            console.error('Error parsing patient data:', err);
            throw new Error(`Failed to parse patient data for ${patientID}`);
        }
    }

}

module.exports = PatientContract;

