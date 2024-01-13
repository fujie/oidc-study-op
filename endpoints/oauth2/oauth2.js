const router = require("express").Router();
const { renameSync } = require("fs");
const utils = require("../../utils/joseUtil");
const jose = require("node-jose");

// 認可エンドポイント
router.get("/authorize", async (req, res) => {
    // 本来なら実装する処理
    // - ユーザの認証
    // - client_idの登録状態の確認
    // - redirect_uriとclient_idが示すクライアントとの対応確認
    // - scopeの確認
    // - 属性送出に関する同意画面の表示

    // 認可コード、id_tokenに必要な値の準備
    const baseUrl = 'https://' + req.headers.host;
    const date = new Date();

    // response_typeの判断
    const response_types = req.query.response_type.split(" ");
    // implicitもしくはHybridを判定するフラグ（フラグメントでレスポンスを返すかどうかの判定）
    let isImplcitOrHybrid = false;
    // レスポンスを保存する配列
    let responseArr = [];
    // ペイロード（暫定なので固定値。有効期限関係だけ個別に含める）
    let payload  = {
        iss: baseUrl,
        aud: req.query.client_id,
        sub: "test",
        email: "test@example.jp",
        name: "taro test",
        given_name: "taro",
        family_name: "test",
        nonce: req.query.nonce
    };
    // response_typeによる処理の振り分け
    if(response_types.includes("code")){
        // code flow
        // 認可コードの作成
        payload.exp = Math.floor((date.getTime() + (1000 * 30)) / 1000); // 有効期限は30秒
        const code = await utils.generateJWE(payload);
        responseArr.push("code=" + code);
    }
    if(response_types.includes("id_token")){
        // implicit/hybrid
        // id_tokenの生成
        payload.exp = Math.floor((date.getTime() + (1000 * 60 * 10)) / 1000);
        payload.iat = Math.floor(date.getTime() / 1000);
        const id_token = await utils.generateJWS(payload);
        responseArr.push("id_token=" + id_token);
        isImplcitOrHybrid = true;
    }
    if(response_types.includes("token")){
        // implicit/hybrid
        // access_tokenの生成
        payload.exp = Math.floor((date.getTime() + (1000 * 60 * 60)) / 1000);
        payload.iat = Math.floor(date.getTime() / 1000);
        const access_token = await utils.generateJWS(payload);
        responseArr.push("access_token=" + access_token);
        isImplcitOrHybrid = true;
    }
    // stateをレスポンスに含める
    responseArr.push("state=" + req.query.state);
    const responseParam = responseArr.join("&");
    // query or fragment
    if(isImplcitOrHybrid){
        // implicit/Hybrid flowなのでフラグメントでレスポンスを返却する
        res.redirect(req.query.redirect_uri + "#" + responseParam);
    } else {
        // code flowなのでクエリでレスポンスを返却する
        res.redirect(req.query.redirect_uri + "?" + responseParam);
    }
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
