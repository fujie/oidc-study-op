const router = require("express").Router();
const fs = require("fs");
const path = require('path');
const utils = require("../../utils/joseUtil");
const userIdentity = require("../../utils/user");
const errors = require("../../utils/error");
require('dotenv').config();

// 認可エンドポイント
router.get("/authorize", async (req, res) => {
    // 本来なら実装する処理
    // - ユーザの認証
    // login_hint属性からユーザ情報を取得する
    const login_hint = req.query.login_hint;
    // - 属性送出に関する同意画面の表示

    // エラーの返却方法にも関連するためresponse_typeの判別は最初にやっておく
    // response_typeの取得
    const response_types = req.query.response_type.split(" ");

    // - client_idの登録状態の確認
    // クライアント情報の読み取り
    const clients = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../database/clients.json")));
    // クライアント登録状態の確認
    const client = clients.find(i => i.client_id === req.query.client_id);
    if(typeof client === "undefined"){
        // クライアントが未登録
        res.redirect(req.query.redirect_uri + errors.errorOnAuthZ(response_types, "invalid_request", "unknown_client_id", req.query.state));
    }else{
        // redirect_uriがclient設定に合致していることの確認
        if(!client.redirect_uris.includes(req.query.redirect_uri)){
            // redirect_uri未登録
            // redirect_uriが不正なのでOPから直接エラーを返却する
            res.status = 400;
            res.json({
                error: "invalid_request",
                error_description: "unknown_redirect_uri",
                state: req.query.state
            })
        }else{
            // redirect_uri確認完了
            // 認可コード、id_tokenに必要な値の準備
            const baseUrl = 'https://' + req.headers.host;
            const date = new Date();

            //
            // scope関連の処理
            //
            // scopeの判断
            const scopes = req.query.scope.split(" ");
            // 本来はscopeにopenidが入っていない場合はエラーとする（仕様上はopenidが含まれない場合の動作は未定義）
            // scopeに応じたユーザの情報を取得する
            // ユーザ名を指定して属性情報を取得する
            // login_hintを使う
            let payload = await userIdentity.getUserIdentityByLoginId(login_hint, scopes);
            // 識別子タイプの判定（Persistent or Transient）
            let PPID;
            switch(process.env.IDENTIFIER_TYPE){
                case "TRANSIENT":
                    // 魔界異なる識別子を生成する
                    PPID = crypto.randomUUID();
                    break;
                case "PERSISTENT":
                default:
                    // Pairwise識別子の生成
                    PPID = utils.createPPID(payload.local_identifier, req.query.redirect_uri);
            }
            // ローカル識別子の削除
            delete payload.local_identifier;
            // PPIDをsubとして設定
            payload.sub = PPID;

            // id_tokenに含める共通属性の設定
            payload.iss = baseUrl;
            payload.aud = req.query.client_id;
            payload.nonce = req.query.nonce;
            
            //
            // response_type関連の処理
            //
            // response_typeの判断
            // const response_types = req.query.response_type.split(" ");
            // implicitもしくはHybridを判定するフラグ（フラグメントでレスポンスを返すかどうかの判定）
            let isImplcitOrHybrid = false;
            // レスポンスを保存する配列
            let responseArr = [];
            
            // response_typeによる処理の振り分け
            let c_hash, at_hash;
            if(response_types.includes("code")){
                // code flow
                // 認可コードの作成
                payload.exp = Math.floor((date.getTime() + (1000 * 30)) / 1000); // 有効期限は30秒
                const code = await utils.generateJWE(payload);
                responseArr.push("code=" + code);
                // c_hashの作成
                c_hash = utils.createHash(Buffer.from(code));
            }
            if(response_types.includes("token")){
                // implicit/hybrid
                // access_tokenの生成
                payload.exp = Math.floor((date.getTime() + (1000 * 60 * 60)) / 1000);
                payload.iat = Math.floor(date.getTime() / 1000);
                const access_token = await utils.generateJWS(payload);
                responseArr.push("access_token=" + access_token);
                isImplcitOrHybrid = true;
                // at_hashの作成
                at_hash = utils.createHash(Buffer.from(access_token));
            }
            if(response_types.includes("id_token")){
                // implicit/hybrid
                // id_tokenの生成
                payload.exp = Math.floor((date.getTime() + (1000 * 60 * 10)) / 1000);
                payload.iat = Math.floor(date.getTime() / 1000);
                // codeがある場合
                if(response_types.includes("code")){
                    payload.c_hash = c_hash;
                }
                // access_tokenがある場合
                if(response_types.includes("token")){
                    payload.at_hash = at_hash;
                }
                const id_token = await utils.generateJWS(payload);
                responseArr.push("id_token=" + id_token);
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
        }
    }

});

// トークンエンドポイント
router.post("/token", async (req, res) => {
    // 本来なら実装する処理
    // - grant_typeの検証

    // - クライアントの認証
    let client_id, client_secret;
    if(typeof req.headers.authorization === "undefined"){
        // client_secret_post
        client_id = req.body.client_id;
        client_secret = req.body.client_secret;
    }else{
        // client_secret_basic
        const b64auth = req.headers.authorization.split(" ")[1];
        [ client_id, client_secret ] = Buffer.from(b64auth, "base64").toString().split(":");
    }
    // クライアント情報の読み取り
    const clients = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../database/clients.json")));
    // クライアント登録状態の確認
    const client = clients.find(i => i.client_id === client_id);
    if(typeof client === "undefined"){
        // クライアントが未登録
        res.statusCode = 400;
        res.json({
            errorMessage: "client not found"
        });
    }else{
        // クライアント登録確認、シークレットの検証
        if(client.client_secret !== client_secret){
            // クライアント認証エラー
            res.statusCode = 400;
            res.json({
                errorMessage: "client authentication was failed"
            });    
        }else{
            // クライアント認証成功
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
        }
    }
});

module.exports = router;
