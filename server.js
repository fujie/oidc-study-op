const express = require("express");
const app = express();

// POSTの取得
app.use(express.urlencoded({ extended: false }));

// ルートの定義
app.use("/", require("./endpoints/root.js"));
app.use("/.well-known", require("./endpoints/discovery.js"));
app.use("/oauth2", require("./endpoints/oauth2/oauth2.js"));

// サーバん起動
app.listen(3000);
