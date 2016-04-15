//引入zTool模块
var zTool = require("./zTool");
var onlineUserMap = new zTool.SimpleMap();
var historyContent = new zTool.CircleList(100);
//引入聊天模块
var chatLib = require("./chatLib");
var EVENT_TYPE = chatLib.EVENT_TYPE;
var PORT = chatLib.PORT;

//使用socket.io直接启动http服务
var io = require("socket.io").listen(PORT);
//进行socket连接监听
io.sockets.on("connection",function(socket){
    socket.on("message",function(message){
        var mData = chatLib.analyzeMessageData(message);
        if (mData && mData.EVENT) {
			switch (mData.EVENT) {
			case EVENT_TYPE.LOGIN: // 新用户连接
				var newUser = {'uid':socket.id, 'nick':chatLib.getMsgFirstDataValue(mData)};

				// 把新连接的用户增加到在线用户列表
				onlineUserMap.put(socket.id, newUser);

				// 把新用户的信息广播给在线用户
                var data = JSON.stringify({
                'user':onlineUserMap.get(socket.id),
                'EVENT' : EVENT_TYPE.LOGIN,
                'values' : [newUser],
                'users':onlineUserMap.values(),
                'historyContent':historyContent.values()
               });
                io.sockets.emit('message',data);//广播
                //socket.emit('message',data);
               // socket.broadcast.emit('message', data);//无效啊啊啊啊！我试了很多次，算是坑
				break;

			case EVENT_TYPE.SPEAK: // 用户发言
				var content = chatLib.getMsgFirstDataValue(mData);
                var data = JSON.stringify({
                    'user':onlineUserMap.get(socket.id),
                    'EVENT' : EVENT_TYPE.SPEAK,
                    'values' : [content]
                });
                //socket.emit('message',data);
                io.sockets.emit('message',data);
                //服务器端保存谈话的历史记录
				historyContent.add({'user':onlineUserMap.get(socket.id),'content':content,'time':new Date().getTime()});
				break;

            case EVENT_TYPE.LOGOUT: // 用户请求退出
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
			// 事件类型出错，记录日志，向当前用户发送错误信息
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