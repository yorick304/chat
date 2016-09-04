//工具类
var zTool = require("./chartTool");
var onlineUserMap = new zTool.SimpleMap();
var historyContent = new zTool.CircleList(100);
//解析工具类
var chatLib = require("./chatLib");
var EVENT_TYPE = chatLib.EVENT_TYPE;
var PORT = chatLib.PORT;

//在服务端建立起socket.io
var io = require("socket.io").listen(PORT);
//在服务器端监听链接
io.sockets.on("connection",function(socket){
    //在服务器端监听消息
    socket.on("message",function(message){
        var mData = chatLib.analyzeMessageData(message);
        if (mData && mData.EVENT) {
			switch (mData.EVENT) {
			case EVENT_TYPE.LOGIN: // 登陆
				var newUser = {'uid':socket.id, 'nick':chatLib.getMsgFirstDataValue(mData)};

				// 用户放在map中
				onlineUserMap.put(socket.id, newUser);

				// 返回的数据包
                var data = JSON.stringify({
                'user':onlineUserMap.get(socket.id),
                'EVENT' : EVENT_TYPE.LOGIN,
                'values' : [newUser],
                'users':onlineUserMap.values(),
                'historyContent':historyContent.values()
               });
                io.sockets.emit('message',data);//登陆之后的返回数据包
                //socket.emit('message',data);//测试
               // socket.broadcast.emit('message', data);//测试
				break;

			case EVENT_TYPE.SPEAK: // 聊天
				var content = chatLib.getMsgFirstDataValue(mData);
                var data = JSON.stringify({
                    'user':onlineUserMap.get(socket.id),
                    'EVENT' : EVENT_TYPE.SPEAK,
                    'values' : [content]
                });
                //socket.emit('message',data);
                io.sockets.emit('message',data);
                //添加历史记录
				historyContent.add({'user':onlineUserMap.get(socket.id),'content':content,'time':new Date().getTime()});
				break;

            case EVENT_TYPE.LOGOUT: //退出
                var user = mData.values[0];
                onlineUserMap.remove(user.uid);
                var data = JSON.stringify({
                    'EVENT' : EVENT_TYPE.LOGOUT,
                    'values' : [user]
                });
                io.sockets.emit('message',data);
                break;

			    default:
				break;
			}

		} else {
			// 没有状态
			console.log('desc:message,userId:' + socket.id + ',message:' + message);
            var data = JSON.stringify({
                'uid':socket.id,
                'EVENT' : EVENT_TYPE.ERROR
            });
            socket.emit('message',data);
		}
   });

});

console.log('Start listening on port ' + PORT);