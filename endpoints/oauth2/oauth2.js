const router = require("express").Router();
const utils = require("../../utils/joseUtil");
const jose = require("node-jose");

// 認可エンドポイント
router.get("/authorize", async (req, res) => {
    // 本来なら実装する処理
    // - ユーザの認証
    // - response_typeによるフローの振り分け
    // - client_idの登録状態の確認
    // - redirect_uriとclient_idが示すクライアントとの対応確認
    // - scopeの確認
    // - 属性送出に関する同意画面の表示

    // codeの生成（本来は暗号化しておく）
    // 最終的にid_tokenに入れる値をDBに保存する代わりに暗号化してcodeに入れておくことでバックエンドを持たずにすませる
    const baseUrl = 'https://' + req.headers.host;

    const date = new Date();
    const jwePayload = {
        iss: baseUrl,
        aud: req.query.client_id,
        sub: "test",
        email: "test@example.jp",
        name: "taro test",
        given_name: "taro",
        family_name: "test",
        nonce: req.query.nonce,
        exp: Math.floor((date.getTime() + (1000 * 30)) / 1000) // 有効期限は30秒
    };
    const code = await utils.generateJWE(jwePayload);
    console.log(code);
    // redirect_uriへリダイレクト
    res.redirect(req.query.redirect_uri + "?code=" + code + "&state=" + req.query.state);
});

// トークンエンドポイント
router.post("/token", async (req, res) => {
    // 本来なら実装する処理
    // - クライアントの認証
    // - grant_typeの検証
    // - codeの検証（有効期限、発行先クライアント、スコープ）
    // - access_tokenの発行
    // - id_tokenの発行
    const decodedCode = await utils.decryptJWE(req.body.code);
    let decodedCodeJSON = JSON.parse(decodedCode);
    // 有効期限確認
    const date = new Date();
    if(decodedCodeJSON.exp < (Math.floor(date.getTime() / 1000))){
        res.statusCode = 400;
        res.json({
            errorMessage: "AuthZ code is expired."
        });
    } else {
        // payload作成
        // 単純に期限を延長しているだけ
        decodedCodeJSON.exp = Math.floor((date.getTime() + (1000 * 60 * 10)) / 1000);
        decodedCodeJSON.iat = Math.floor(date.getTime() / 1000);
        const token = await utils.generateJWS(decodedCodeJSON);
        console.log(token);
        res.json({
            access_token: token, // ちなみにEntra IDの場合はaccess_tokenもid_tokenとほぼ同じものが使われるケースもある。
            token_type: "Bearer",
            expires_in: 3600,
            id_token: token
        });
    }
});

module.exports = router;
