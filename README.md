# OpenID Providerを作りつつOpenID Connectを学ぼう  

OpenID Connectを学ぶにはOpenID Providerを実装してみるのが一番早いはず。ということで最低限の実装をしているので順次育てつつ勉強していこうと思います。  

## 導入方法
- クローン
    - ``git clone git@github.com:fujie/oidc-study-op.git``  
- インストール
    - ``npm install``  
- 鍵の作成
    - ``cd keys``  
    - ``node createKeystore.js``  
- 起動
    - ``cd ..``
    - ``node server.js``
    - http://localhost:3000で起動しますがngrokを通して使うことを想定しています。
        - 認可エンドポイント: https://{host}/oauth2/authorize
        - トークンエンドポイント: https://{host}/oauth2/token
        - userInfoエンドポイント: https://{host}/userinfo
        - jwks_uriエンドポイント: https://{host}/jwks_uri
        - ディスカバリエンドポイント：https://{host}/.well-known/openid-configuration

## 実装状態
- 認可エンドポイント（/oauth2/authorize）
    - codeフロー前提です（response_typeを指定しても無視します）
    - ユーザ認証はしません。ハードコードされたユーザ情報を使っています
    - 属性提供に関する同意は行なっていません
    - バックエンドにDBを持たないため認可コードに必要な情報を詰め込んで暗号化（JWE）、トークンエンドポイントで復号した上でIDトークンに再構成しています
- トークンエンドポイント（/oauth2/token）
    - クライアントID/シークレットでのクライアント認証は行なっていません
    - アクセストークンはIDトークンと同じものを使っています（Entra方式）※結果、expも同い値となっています
    - リフレッシュトークンの発行は行いません
- userInfoエンドポイント（/userinfo）
    - アクセストークンの署名検証をした上でトークン内のユーザ情報を返却しています（Entra方式)
- jwks_uriエンドポイント（/jwks_uri）
    - IDトークンの署名の検証に利用する鍵を公開しています
- ディスカバリエンドポイント（/.well-known/openid-configuration）
    - エンドポイントのURL以外のメタデータはあまり正確ではありません
- その他全般
    - エラーハンドリングなど全く考慮していません

## モジュールの説明
- /server.js
    - 起動するためのモジュールです
- /endpoints/discovery.js
    - ディスカバリエンドポイントを実装しています
- /endpoints/root.js
    - jwks_uriおよびuserinfoエンドポイントを実装しています
- /endopoints//oauth2/oauth2.js
    - 認可エンドポイント、トークンエンドポイントを実装しています
