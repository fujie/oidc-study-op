const router = require("express").Router();

// Discoveryエンドポイント
router.get("/openid-configuration", (req, res) => {
    const baseUrl = 'https://' + req.headers.host;
    const response_types = ["code"];
    const subject_types = ["public"];
    const alg_values = ["RS256"];
    const scopes = ["openid"];
    const auth_methods = ["client_secret_post", "client_secret_basic"];
    const claims =["sub", "name", "given_name", "family_name", "email", "email_verified", "iss", "aud", "exp", "exp", "iat"];
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
