const router = require("express").Router();
const jose = require("node-jose");
const fs = require("fs");
const path = require('path');
const utils = require('../utils/joseUtil');

// jwks_uriエンドポイント
router.get('/jwks_uri', async (req, res) => {
    const ks = fs.readFileSync(path.resolve(__dirname, "../keys/keystoreSign.json"));
    const keyStore = await jose.JWK.asKeyStore(ks.toString());
    res.json(keyStore.toJSON())
});

// userInfoエンドポイント
router.get("/userinfo", async (req, res) => {
    const access_token = req.headers.authorization.replace("Bearer ", "");
    const decodedPayload = await utils.verifyJWS(access_token);
    const decodedTokenJSON = JSON.parse(decodedPayload);
    // 有効期限確認
    const date = new Date();
    if(decodedTokenJSON.exp < (Math.floor(date.getTime() / 1000))){
        res.statusCode = 403;
        res.json({
            errorMessage: "access token is expired."
        });
    } else {
        res.json({
            sub: decodedTokenJSON.sub,
            name: decodedTokenJSON.name,
            given_name: decodedTokenJSON.given_name,
            family_name: decodedTokenJSON.family_name,
            email: decodedTokenJSON.email,
            email_verified: true
        })
    }
});

module.exports = router;
