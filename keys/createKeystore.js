const fs = require('fs');
const jose = require('node-jose');

// 署名用鍵の生成
const keyStoreForSygn = jose.JWK.createKeyStore();
keyStoreForSygn.generate('RSA', 2048, {alg: 'RS256', use: 'sig' })
.then(result => {
  fs.writeFileSync(
    'keystoreSign.json', 
    JSON.stringify(keyStoreForSygn.toJSON(true), null, '  ')
  )
});

// 暗号化用鍵の生成
// const keyStoreForEnc = jose.JWK.createKeyStore();
// keyStoreForEnc.generate('RSA', 2048, {alg: 'RSA-OAEP', use: 'enc', key_ops: ["wrap","verify"] })
// .then(result => {
//   fs.writeFileSync(
//     'keystoreEnc.json', 
//     JSON.stringify(keyStoreForEnc.toJSON(true), null, '  ')
//   )
// });

console.log("done");