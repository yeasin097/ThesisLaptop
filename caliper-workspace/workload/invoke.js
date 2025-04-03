'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class AssetTransferWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
        this.workerIndex = 0;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        this.workerIndex = workerIndex; // Store worker index for unique IDs
    }

    async submitTransaction() {
        this.txIndex++;
        const timestamp = Date.now(); // Add timestamp for uniqueness across runs
        const assetId = `asset_w${this.workerIndex}_${timestamp}_${this.txIndex}`;
        const args = {
            contractId: 'basic',
            contractFunction: 'CreateAsset',
            contractArguments: [assetId, 'blue', '10', 'Alice', '100'],
            invokerIdentity: 'User1',
            readOnly: false
        };

        let maxRetries = 5;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                await this.sutAdapter.sendRequests(args);
                return; // Success, exit function
            } catch (error) {
                if (error.message && error.message.includes('MVCC_READ_CONFLICT') && attempt < maxRetries - 1) {
                    console.warn(`MVCC Conflict, retrying... (${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
                } else {
                    throw error;
                }
            }
        }
    }
}

function createWorkloadModule() {
    return new AssetTransferWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
