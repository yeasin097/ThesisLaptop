'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class DoctorContract extends Contract {

    async InitLedger(ctx) {
        var ss = "contract doctor initialized";
        return ss;
    }

    // CreateDoctor issues a new doctor to the world state with given details.
    async CreateDoctor(ctx, bmdcNo, name) {
        const doctorID = "d"+bmdcNo;
        const exists = await this.DoctorExists(ctx, doctorID);
        if (exists) {
            throw new Error(`The doctor ${doctorID} already exists`);
        }

        const doctor = {
            doctorName: name,
            doctorID: doctorID,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(doctorID, Buffer.from(stringify(sortKeysRecursive(doctor))));
        return JSON.stringify(doctor);
    }

    // ReadDoctor returns the doctor stored in the world state with given doctorID.
    async ReadDoctor(ctx, doctorID) {
        const doctorJSON = await ctx.stub.getState(doctorID); // get the doctor from chaincode state
        if (!doctorJSON || doctorJSON.length === 0) {
            throw new Error(`The doctor ${doctorID} does not exist`);
        }
        return doctorJSON.toString();
    }

    // DeleteDoctor deletes an given doctor from the world state.
    async DeleteDoctor(ctx, doctorID) {
        const exists = await this.DoctorExists(ctx, doctorID);
        if (!exists) {
            throw new Error(`The doctor ${doctorID} does not exist`);
        }
        return ctx.stub.deleteState(doctorID);
    }

    // DoctorExists returns true when doctor with given doctorID exists in world state.
    async DoctorExists(ctx, doctorID) {
        const doctorJSON = await ctx.stub.getState(doctorID);
        return doctorJSON && doctorJSON.length > 0;
    }

    // GetAlldoctors returns all doctors found in the world state.
    async GetAll(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all doctors in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}

module.exports = DoctorContract;
