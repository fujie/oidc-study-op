exports.getUserIdentity = function(scopes) {
    // ユーザデータの定義
    let userIdentity = {
        local_identifier: "test",
        // profile scope
        name: "taro test",
        given_name: "taro",
        family_name: "test",
        middle_name: "",
        nickname: "",
        preferred_username: "test@example.jp",
        profile: "https://twitter.com/phr_eidentity",
        picture: "https://1.gravatar.com/avatar/25eee85430bd0bbdcb9cff75655afa43cc9f69bc8730aec852d8538179646ef1",
        website: "hhtps://idmlab.eidentity.jp",
        gender: "male",
        birthdate: "1900-01-01",
        zoneinfo: "Japan",
        locale: "jp_JP",
        updated_at: 1704034800,
        // email scope
        email: "test@example.jp",
        email_verified: true,
        // address scope
        address: {
            formatted: "Kokyogaien, Chiyoda-ku, Tokyo 1000002 JAPAN",
            street_address: "Kokyogaien",
            locality: "Chiyoda-ku",
            region: "Tokyo",
            postal_code: "1000002",
            country: "JP"
        },
        // phone scope
        phone_number: "+81-3-1234-5678",
        phone_number_verified: true
    }
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