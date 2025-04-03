import { create as ipfsHttpClient } from 'ipfs-http-client';

const ipfs = ipfsHttpClient({ host: 'localhost', port: 5001, protocol: 'http' });

export const uploadToIPFS = async (data) => {
    try {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        const { cid } = await ipfs.add(payload);
        console.log("File uploaded to IPFS with CID:", cid.toString());
        return cid.toString();
    } catch (error) {
        console.error('IPFS upload error:', error);
        throw error;
    }
};

export const fetchFromIPFS = async (cid) => {
    try {
        let data = [];
        for await (const chunk of ipfs.cat(cid)) {
            data.push(...chunk);
        }
        return Buffer.from(data).toString();
    } catch (error) {
        console.error('IPFS fetch error:', error);
        throw error;
    }
}; 