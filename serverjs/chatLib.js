(function(exports){
	// 事件类型
	exports.EVENT_TYPE = {'LOGIN':'LOGIN', 'LOGOUT':'LOGOUT', 'SPEAK':'SPEAK', 'LIST_USER':'LIST_USER', 'ERROR':'ERROR', 'LIST_HISTORY':'LIST_HISTORY'};

	// 服务端口
	exports.PORT = 8080;

	// 服务端口
	exports.HOST = "localhost";
    //解析JSON数据的消息
	var analyzeMessageData = exports.analyzeMessageData = function(message) {
		try {
            //解析消息
			return JSON.parse(message);
		} catch (error) {
			// 收到了非正常格式的数据
			console.log('method:analyzeMsgData,error:' + error);
		}

		return null;
	}
    //获取第一个数据消息
	var getMsgFirstDataValue = exports.getMsgFirstDataValue = function (mData) {
		if (mData && mData.values && mData.values[0]) {
			return mData.values[0];
		}

		return '';
	}

})( (function(){
    if(typeof exports === 'undefined') {
        window.chatLib = {};
        return window.chatLib;
    } else {
        return exports;
    }
})() );