import crypto from 'node:crypto';

export function getHash(value, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(value).digest('hex');
} 