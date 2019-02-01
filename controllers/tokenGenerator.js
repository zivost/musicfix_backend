"use strict";

const jwt = require("jsonwebtoken");

let privateKey = [
    '-----BEGIN PRIVATE KEY-----',
    'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgy16/+2/vqW+D2u0GKhhzQkryJanu/LCTltUyRFv53yigCgYIKoZIzj0DAQehRANCAATza+XEWkMk3Jo6BPsDTspI9W0VFEkDZ3btHq4AzAiw6ji2YyxhGKglSjcN279CpOckWDfPnUj36pmddHoB0Yds',
    '-----END PRIVATE KEY-----'
].join('\n');
const teamId     = "7J99YAQ5AQ";
const keyId      = "AUTCH7BW5N";

const jwtToken = jwt.sign({}, privateKey, {
    algorithm: "ES256",
    expiresIn: "180d",
    issuer: teamId,
    header: {
        alg: "ES256",
        kid: keyId
    }
});

console.log(jwtToken);