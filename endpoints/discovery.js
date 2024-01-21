const router = require("express").Router();

// Discoveryエンドポイント
router.get("/openid-configuration", (req, res) => {
    const baseUrl = 'https://' + req.headers.host;
    const response_types = ["code", "code token", "code id_token", "code token id_token", "token", "id_token"];
    const subject_types = ["pairwise"];
    const alg_values = ["RS256"];
    const scopes = ["openid", "profile", "email", "address", "phone"];
    const auth_methods = ["client_secret_post", "client_secret_basic"];
    const claims_openid = ["sub", "iss", "aud", "exp", "iat", "nonce", "c_hash", "at_hash"];
    const claims_profile = ["name", "family_name", "given_name", "middle_name", "nick_name", "preffered_username", "profile", "picture", "website", "gender", "birthdate", "zoneinfo", "locale", "updated_at"];
    const claims_email = ["email", "email_verified"];
    const claims_address = ["address"];
    const claims_phone = ["phone_number", "phone_number_verified"];
    const claims = claims_openid.concat(claims_profile, claims_email, claims_address, claims_phone);
    res.json({
        issuer: baseUrl,
        authorization_endpoint: baseUrl + "/oauth2/authorize",
        token_endpoint: baseUrl + "/oauth2/token",
        userinfo_endpoint: baseUrl + "/userinfo",
        jwks_uri: baseUrl + "/jwks_uri",
        response_types_supported: response_types,
        subject_types_supported: subject_types,
        id_token_signing_alg_values_supported: alg_values,
        scopes_supported: scopes,
        token_endpoint_auth_methods_supported: auth_methods,
        claims_supported: claims
    });
});

module.exports = router;
