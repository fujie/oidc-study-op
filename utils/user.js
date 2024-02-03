require('dotenv').config();

exports.getUserIdentityByLoginId = async function(login_id, scopes) {
    // JSONBin用のヘッダ
    const headers = new Headers({
        "X-Master-Key": process.env.JSONBIN_MASTER_KEY,
        "Content-Type": "application/json"
    });
    // JSONBinのユーザCollectionからユーザbinのidを取得する
    const collectionUrl = new URL(`${process.env.JSONBIN_BASEURL}/c/${process.env.JSONBIN_USERCOLLECTION_ID}/bins`);
    const collectionResponse = await fetch(collectionUrl, {
        headers: headers
    });
    const userCollection = await collectionResponse.json();
    const userBin = userCollection.find(i => i.snippetMeta.name === login_id);
    if(typeof userBin === "undefined"){
        console.log("user not found");
    }else{
        //　当該ユーザのBin idからBinの中身を読み出す
        const userBinUrl = new URL(`${process.env.JSONBIN_BASEURL}/b/${userBin.record}`);
        const userBinResponse = await fetch(userBinUrl, {
            headers: headers
        });
        const userJson = await userBinResponse.json();
        const userIdentity = userJson.record;
        // subをlocal_identifierへセット
        userIdentity.local_identifier = userIdentity.sub;
        // スコープによって返却する属性の絞り込み
        if(!scopes.includes("profile")){
            delete userIdentity.name;
            delete userIdentity.given_name;
            delete userIdentity.family_name;
            delete userIdentity.middle_name;
            delete userIdentity.nickname;
            delete userIdentity.preferred_username;
            delete userIdentity.profile;
            delete userIdentity.picture;
            delete userIdentity.website;
            delete userIdentity.gender;
            delete userIdentity.birthdate;
            delete userIdentity.zoneinfo;
            delete userIdentity.locale;
            delete userIdentity.updated_at
        };
        if(!scopes.includes("email")){
            delete userIdentity.email;
            delete userIdentity.email_verified;
        };
        if(!scopes.includes("address")){
            delete userIdentity.address;
        };
        if(!scopes.includes("phone")){
            delete userIdentity.phone_number;
            delete userIdentity.phone_number_verified;
        };
        return userIdentity;
    }
}