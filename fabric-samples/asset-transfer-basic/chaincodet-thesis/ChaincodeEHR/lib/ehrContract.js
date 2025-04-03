const { Contract } = require('fabric-contract-api');

class ResearcherEHRContract extends Contract {

    async InitLedger(ctx) {
        console.log('Researcher EHR Contract Initialized');
    }

    async getEHRStats(ctx) {
        const iterator = await ctx.stub.getStateByRange('', '');
        const stats = {
            totalRecords: 0,
            diagnosisCount: {},
            medicationCount: {},
        };

        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const ehr = JSON.parse(res.value.value.toString('utf8'));
                stats.totalRecords++;
                
                const diagnosis = ehr.ehr_details.diagnosis;
                stats.diagnosisCount[diagnosis] = (stats.diagnosisCount[diagnosis] || 0) + 1;
                
                ehr.ehr_details.medications.forEach(med => {
                    stats.medicationCount[med] = (stats.medicationCount[med] || 0) + 1;
                });
            }
            if (res.done) break;
        }
        return JSON.stringify(stats);
    }

    async CreateEHR(ctx, ehr_id, ehr_info) {
        if (!ehr_id || !ehr_info) {
            throw new Error('Invalid input: ehrID and ehr_info both are required');
        }

        const existingehr = await ctx.stub.getState(ehr_id);
        if (existingehr && existingehr.length > 0) {
            throw new Error(`EHR ID ${ehr_id} already exists`);
        }

        await ctx.stub.putState(ehr_id, Buffer.from(JSON.stringify(ehr_info)));
        console.info(`EHR record for ID ${ehr_id} created`);

        return ehr_id;
    }

    async GetEHRsByNIDHash(ctx, patient_id) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        console.log(`Retrieving EHRs for patient ID: ${patient_id}`);
        
        let result = await iterator.next();
        while (!result.done) {
            try {
                const ehr = JSON.parse(JSON.parse(result.value.value.toString('utf8')));
                if (ehr.patient_id === patient_id) {
                    allResults.push(ehr);
                }
            } catch (err) {
                console.error("Error parsing EHR record:", err);
            }
            result = await iterator.next();
        }
        
        console.info(`Total EHR records found for patient ID ${patient_id}: ${allResults.length}`);
        return JSON.stringify(allResults);
    }

    async GetAll(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        console.log("Entering Loop from GET ALL");
        let result = await iterator.next();
        while (!result.done) {
            try {
                const ehr = JSON.parse(JSON.parse(result.value.value.toString('utf8')));
                allResults.push(ehr);
            } catch (err) {
                console.error("Error parsing EHR record:", err);
            }
            result = await iterator.next();
        }

        console.info('All EHR records retrieved');
        return allResults;
    }
}

module.exports = ResearcherEHRContract;
