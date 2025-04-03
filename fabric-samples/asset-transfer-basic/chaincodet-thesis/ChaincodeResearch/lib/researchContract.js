'use strict';

const { Contract } = require('fabric-contract-api');

class ResearcherContract extends Contract {
    async InitLedger(ctx) {
        console.info('Initializing the Researcher ledger');
    }

    async CreateResearcher(ctx, researcherID, name) {
        const exists = await this.ResearcherExists(ctx, researcherID);
        if (exists) {
            throw new Error(`Researcher ${researcherID} already exists`);
        }

        const researcher = {
            researcherID,
            name,
            docType: 'researcher'
        };

        await ctx.stub.putState(researcherID, Buffer.from(JSON.stringify(researcher)));
        return JSON.stringify(researcher);
    }

    async ReadResearcher(ctx, researcherID) {
        const researcherJSON = await ctx.stub.getState(researcherID);
        if (!researcherJSON || researcherJSON.length === 0) {
            throw new Error(`Researcher ${researcherID} does not exist`);
        }
        return researcherJSON.toString();
    }

    async DeleteResearcher(ctx, researcherID) {
        const exists = await this.ResearcherExists(ctx, researcherID);
        if (!exists) {
            throw new Error(`Researcher ${researcherID} does not exist`);
        }
        await ctx.stub.deleteState(researcherID);
    }

    async ResearcherExists(ctx, researcherID) {
        const researcherJSON = await ctx.stub.getState(researcherID);
        return researcherJSON && researcherJSON.length > 0;
    }

    async GetAll(ctx) {
        const allResults = [];
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

module.exports = ResearcherContract;
