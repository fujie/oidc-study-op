exports.errorOnAuthZ = function(response_types, error_code, error_description, state) {
    // implicitもしくはHybridを判定するフラグ（フラグメントでレスポンスを返すかどうかの判定）
    let mode;
    if(response_types.includes("token") || response_types.includes("id_token")){
        // ImplicitもしくはHybridフロー
        mode = "#";
    }else{
        // codeフロー
        mode = "&";
    }
    return(mode + "error=" + error_code + "&error_description=" + error_description + "&state=" + state);
}
