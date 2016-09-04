var HOST = chatLib.HOST;
var EVENT_TYPE = chatLib.EVENT_TYPE;
var PORT = chatLib.PORT;

$(document).ready(function() {
	var socket = null;
	var onlineUserMap = new chartTool.SimpleMap();//获取在线用户的Map
	var currentUser = null;
	var currentUserNick = null;
    var loginTime = 0;
    var me = null;
    //检查浏览器是否支持WebSocket
	if (typeof WebSocket === 'undefined') {
		$("#prePage").hide();
		$("#errorPage").show();
	}
   //更新在线人数
	function updateOnlineUser() {
        $('#currentUser').html("<div>当前用户："+me.nick+"</div>");
		var html = ["<div>在线用户(" + onlineUserMap.size() + ")</div>"];
		if (onlineUserMap.size() > 0) {
			var users = onlineUserMap.values();
            var number = users.length;
			for ( var i=0;i<number;i++) {
				html.push("<div class=''>");
				if (users[i].uid == me.uid) {
					html.push("<b>" + formatUserString(users[i]) + "</b>");
				} else {
					html.push(formatUserString(users[i]));
				}
				html.push("</div>");
			}
		}
		$("#onlineUsers").html(html.join(''));
	}

    //发送消息
	function appendMessage(msg) {
		$("#talkFrame").append("<div>" + msg + "</div>");
        $('#talkFrame').scrollTop($("#talkFrame").scrollTop()+200);
	}
    //解析用户信息
	function formatUserString(user) {
		if (!user) {
			return '';
		}
		return user.nick + "<span class='gray'>(" + user.uid + ")</span> ";
	}
    //解析用户谈话
	function formatUserTalkString(user) {
		return formatUserString(user) + new Date().format("hh:mm:ss") + " ";
	}
    //解析用户历史记录的信息
	function formatUserTalkHisString(user, time) {
		return formatUserString(user) + new Date(time).format("yyyy-MM-dd hh:mm:ss") + " ";
	}

	function reset() {
		if (socket) {
			socket.close();
		}
		socket = null;
		onlineUserMap = null;
		currentUser = null;
		$("#onlineUsers").html("");
		$("#talkFrame").html("");
		$("#nickInput").val("");
	}

	function close() {

	}

	$("#open").click(function(event) {
		currentUserNick = $.trim($("#nickInput").val());
		if ('' == currentUserNick) {
			alert('请先输入昵称');
			return;
		}

		$("#prePage").hide();
		$("#mainPage").show();
		reset();

        socket = io.connect(HOST+':'+PORT,{
           "transports":['websocket','polling']
        });

        onlineUserMap = new chartTool.SimpleMap();
        socket.on('connect', function () {
            socket.emit('message', JSON.stringify({
                'EVENT' : EVENT_TYPE.LOGIN,
                'values' : [currentUserNick]
            }));
        });

        //本地客户端信息监听
        socket.on("message",function(message){
            var mData = chatLib.analyzeMessageData(message);
            if (mData && mData.EVENT) {
                switch (mData.EVENT) {
                    case EVENT_TYPE.LOGIN: 
                        // 新用户连接
                        var user = mData.values[0];
                        loginTime++;
                        if(loginTime==1){
                            me = user;
                        }
                        console.log('loginTime'+loginTime);
                        //获得所有在线用户
                        var users = mData.users;
                        if (users && users.length) {
                            var number = users.length
                            for ( var i=0;i<number;i++) {
                                onlineUserMap.put(users[i].uid, users[i]);
                                if (mData.user.uid == users[i].uid) {
                                    currentUser = users[i];
                                }
                            }
                        }
                        //获取最近的历史消息
                        var data = mData.historyContent;
                        if (data && data.length) {
                            var number = data.length;
                            for ( var i=0;i<number;i++) {
                                appendMessage(formatUserTalkHisString(data[i].user, data[i].time));
                                appendMessage("<span>&nbsp;&nbsp;</span>" + data[i].content);
                            }
                            appendMessage("<span class='gray'>==================以上为最近的历史消息==================</span>");
                        }
                        updateOnlineUser();
                        $('#onlineUsers').scrollTop($("#onlineUsers").scrollTop()+20);
                        appendMessage(formatUserTalkString(user) + "[进入房间]");
                        break;

                    case EVENT_TYPE.LOGOUT: // 用户退出
                        var user = mData.values[0];
                        onlineUserMap.remove(user.uid);
                        updateOnlineUser();
                        appendMessage(formatUserTalkString(user) + "[离开房间]");
                        break;

                    case EVENT_TYPE.SPEAK: // 用户发言
                        var content = mData.values[0];
                        appendMessage(formatUserTalkString(mData.user));
                        appendMessage("<span>&nbsp;&nbsp;</span>" + content);
                        break;

                    case EVENT_TYPE.ERROR: // 出错了
                        appendMessage("[系统繁忙...]");
                        break;

                    default:
                        break;
                }

            }

        });
        //出现异常
        socket.on("error",function(){
            appendMessage("[网络出错啦，请稍后重试...]");
        });

        //socket关闭
        socket.on("close",function(){
            appendMessage("[网络连接已被关闭...]");
            close();
        });
	});


	$("#message").keyup(function(event) {
		if (13 == event.keyCode) {
			sendMsg();
		}
	});

	function sendMsg() {
		var value = $.trim($("#message").val());
		if (value) {
			$("#message").val('');
            var data = JSON.stringify({
                'EVENT' : EVENT_TYPE.SPEAK,
                'values' : [value]
            });
            socket.emit('message',data);
		}
	};

	$("#send").click(function(event) {
		sendMsg();
	});

	function show(value) {
		$("#response").html(value);
	};

    function logout(){
        var data = JSON.stringify({
            'EVENT' : EVENT_TYPE.LOGOUT,
            'values' : [currentUser]
        });
        socket.emit('message',data);
        location.reload();
    }
    $("#logout").click(function(event){
        logout();
        $("#prePage").show();
        $("#mainPage").hide();
    });
});
