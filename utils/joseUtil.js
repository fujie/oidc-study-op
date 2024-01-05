const fs = require('fs');
const path = require('path');
const jose = require('node-jose');

// 暗号・復号キー
const encryptKeyString = "1234567890abcdef1234567890abcdef";
// 署名用キー
const keyStoreFile = "../keys/keystoreSign.json";

// JWEの作成
exports.generateJWE = async function(payload) {
    const key = await jose.JWK.asKey({kty:'oct', k: jose.util.base64url.encode(encryptKeyString)});
    return jose.JWE.createEncrypt({format:'compact'},key).update(JSON.stringify(payload)).final();
}

// JWEの復号
exports.decryptJWE = async function(encrypted) {
    const key = await jose.JWK.asKey({kty:'oct', k: jose.util.base64url.encode(encryptKeyString)});
    return (await jose.JWE.createDecrypt(key).decrypt(encrypted)).payload.toString();
}

// JWSの作成
exports.generateJWS = async function(payload) {
    const ks = fs.readFileSync(path.resolve(__dirname, keyStoreFile));
    const keyStore = await jose.JWK.asKeyStore(ks.toString());
    const [key] = keyStore.all({ use: 'sig' });    
    const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } };
    return jose.JWS.createSign(opt, key).update(JSON.stringify(payload)).final();
}

// JWSの検証
exports.verifyJWS = async function(jws) {
    const ks = fs.readFileSync(path.resolve(__dirname, keyStoreFile));
    const keyStore = await jose.JWK.asKeyStore(ks.toString());
    return (await jose.JWS.createVerify(keyStore).verify(jws)).payload.toString();
}