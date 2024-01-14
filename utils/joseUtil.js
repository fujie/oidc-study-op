const fs = require('fs');
const path = require('path');
const jose = require('node-jose');
const crypto = require('crypto');

// 暗号・復号キー
const encryptKeyString = "1234567890abcdef1234567890abcdef";
// 署名用キー
const keyStoreFile = "../keys/keystoreSign.json";
// Pairwise識別子生成用のsalt
const saltForPPID = "1234567890";

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

// ハッシュの作成
exports.createHash = function createHash(plainText){
    // SHA256でハッシュを取る
    const h = crypto.createHash('sha256').update(plainText).digest('hex');
    // 左半分をBase64Urlエンコードする
    return Buffer.from(h.slice(0, h.length /2)).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

// Pairwise識別子の生成
exports.createPPID = function createPPID(local_identifier, redirect_uri){
    // sector_identifierの生成
    const url = new URL(redirect_uri);
    const sector_identifier = url.host;
    return crypto.createHash('sha256').update(sector_identifier + local_identifier + saltForPPID).digest('hex');
}
