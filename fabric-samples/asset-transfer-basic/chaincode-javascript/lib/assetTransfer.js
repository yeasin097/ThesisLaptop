/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const doctors = [
            {
                doctorName: 'Doctor0',
                bmdcNo: '0000',
            },
            {
                doctorName: 'Doctor1',
                bmdcNo: '0001',
            }
        
        ];

        for (const doctor of doctors) {
            doctor.docType = 'doctor';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(doctor.bmdcNo, Buffer.from(stringify(sortKeysRecursive(doctor))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, name) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const doctor = {
            doctorName: name,
            bmdcNo: id,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(doctor))));
        return JSON.stringify(doctor);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    // async UpdateAsset(ctx, id, color, size, owner, appraisedValue, unsellable) {
    //     const exists = await this.AssetExists(ctx, id);
    //     if (!exists) {
    //         throw new Error(`The asset ${id} does not exist`);
    //     }

    //     // overwriting original asset with new asset
    //     const updatedAsset = {
    //         ID: id,
    //         Color: color,
    //         Size: size,
    //         Owner: owner,
    //         AppraisedValue: appraisedValue,
    //         Unsellable: unsellable,
    //     };
    //     // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    //     return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    // }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    // async TransferAsset(ctx, id, newOwner) {

    //     const not_sellable = await this.NotSellable(ctx, id);
    //     if(not_sellable==true) {
    //         throw new Error(`The asset ${id} is not sellable or tranferable`);
    //     }
    //     const doctorstring = await this.ReadAsset(ctx, id);
    //     const asset = JSON.parse(doctorstring);
    //     const oldOwner = asset.Owner;
    //     asset.Owner = newOwner;
    //     // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    //     await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
    //     return oldOwner;
    // }

    // GetAlldoctors returns all doctors found in the world state.
    async GetAlldoctors(ctx) {
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


    // async NotSellable(ctx, id) {
    //     const doctorstring = await this.ReadAsset(ctx, id);
    //     const asset = JSON.parse(doctorstring);
    //     return asset.Unsellable;
    // }

    // async SwapAsset(ctx, id1, id2) {
    //     const doctorstring1 = await this.ReadAsset(ctx, id1); // load from the ledger
    //     const doctorstring2 = await this.ReadAsset(ctx, id2);
    //     const asset1 = JSON.parse(doctorstring1);
    //     const asset2 = JSON.parse(doctorstring2); // to json object, so that updating will be easy.
    //     const owner1 = asset1.Owner;
    //     const owner2 = asset2.Owner; // saving owner name to variables.

    //     asset1.Owner = owner2;
    //     asset2.Owner = owner1; // swapping the owner. 

    //     await ctx.stub.putState(id1, Buffer.from(stringify(sortKeysRecursive(asset1))));
    //     await ctx.stub.putState(id2, Buffer.from(stringify(sortKeysRecursive(asset2))));
    //     return "Swapping Successfull"
    // }
}

module.exports = AssetTransfer;
