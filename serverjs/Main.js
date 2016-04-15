//����zToolģ��
var zTool = require("./zTool");
var onlineUserMap = new zTool.SimpleMap();
var historyContent = new zTool.CircleList(100);
//��������ģ��
var chatLib = require("./chatLib");
var EVENT_TYPE = chatLib.EVENT_TYPE;
var PORT = chatLib.PORT;

//ʹ��socket.ioֱ������http����
var io = require("socket.io").listen(PORT);
//����socket���Ӽ���
io.sockets.on("connection",function(socket){
    socket.on("message",function(message){
        var mData = chatLib.analyzeMessageData(message);
        if (mData && mData.EVENT) {
			switch (mData.EVENT) {
			case EVENT_TYPE.LOGIN: // ���û�����
				var newUser = {'uid':socket.id, 'nick':chatLib.getMsgFirstDataValue(mData)};

				// �������ӵ��û����ӵ������û��б�
				onlineUserMap.put(socket.id, newUser);

				// �����û�����Ϣ�㲥�������û�
                var data = JSON.stringify({
                'user':onlineUserMap.get(socket.id),
                'EVENT' : EVENT_TYPE.LOGIN,
                'values' : [newUser],
                'users':onlineUserMap.values(),
                'historyContent':historyContent.values()
               });
                io.sockets.emit('message',data);//�㲥
                //socket.emit('message',data);
               // socket.broadcast.emit('message', data);//��Ч���������������˺ܶ�Σ����ǿ�
				break;

			case EVENT_TYPE.SPEAK: // �û�����
				var content = chatLib.getMsgFirstDataValue(mData);
                var data = JSON.stringify({
                    'user':onlineUserMap.get(socket.id),
                    'EVENT' : EVENT_TYPE.SPEAK,
                    'values' : [content]
                });
                //socket.emit('message',data);
                io.sockets.emit('message',data);
                //�������˱���̸������ʷ��¼
				historyContent.add({'user':onlineUserMap.get(socket.id),'content':content,'time':new Date().getTime()});
				break;

            case EVENT_TYPE.LOGOUT: // �û������˳�
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
			// �¼����ͳ�����¼��־����ǰ�û����ʹ�����Ϣ
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