let socket = io.connect();
let chatName = null;
let loggedOut = `<div id = "loginPanel">
                     <div id ="loginText">Choose a username</div>
                     <div id="inputFields">
                     <input id = "username" placeholder = "connect"/>
                     <button id = "signIn">Connect</button>
                     </div>
                   </div>`;
let _localvideo = document.querySelector("#localvideo");
let localStream;
let _remotevideo = document.querySelector("#remotevideo");

let room;
let CHATROOM;

let isChannelReady = false;
let isInitiator = false;
let isStarted = false;

let pc;
let remoteStream;
let turnReady;

let pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
let sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

let constraints = {
  video: true
};

document.addEventListener("click", function(e){
  if (e.target && e.target.id == "login") {
    openLightBox();
  }
  if (e.target && e.target.id == "users") {
    openLightBox();
  }
  if (e.target && e.target.id == "close") {
    closeLightBox();
  }
  if (e.target && e.target.id == "fade") {
    closeLightBox();
  }
  if (e.target && e.target.id == "login"){
    let _light = document.querySelector('#light');
    let loggedIn = `<div id = "loginPanel"><div id ="loginText">You are logged in as: ${chatName}</div><button id = "signOut">Logout</button></div>`;
    if(chatName == null){
      _light.innerHTML = loggedOut;
    }
    else {
      _light.innerHTML = loggedIn;
    }
  }
  if (e.target && e.target.id == "signIn"){
    let _username = document.querySelector("#username");
    let _signIn = document.querySelector("#signIn");
    e.preventDefault();
    if (!_username.value == " "){
      // check for duplicate user
      socket.on('duplicate username', function (data) {
        if (data == true) {
          _username.value="";
          _username.placeholder = "Username taken!";
          return;
        }
      });
      //no duplicate found... continue
      socket.emit('new user', _username.value, function() {
        chatName = _username.value;
        let loggedIn = `<div id ="loginText">You are logged in as: ${chatName}</div><div id = "loginPanel"><button id = "signOut">Logout</button></div>`;
        document.querySelector("#loginPanel").innerHTML = loggedIn;
        startCam();
      });
    }
  }
  if (e.target && e.target.id == "signOut"){
    logOut();
  }
  if (e.target && e.target.id == "users"){
    let _light = document.querySelector('#light');
    _light.innerHTML = `<div id = "onlineList"></div>`;
    onlineUsers();
  }
  if (e.target && e.target.classList.contains("caller")){
    isInitiator = true;
    console.log("Calling user...", e.target.id);

    e.target.classList.remove("icofont-phone-circle");
    e.target.classList.remove("callButton");
    e.target.classList.add("hangupButton");

    e.target.style.backgroundColor = "red";

    room = chatName;
    socket.emit('create or join', room);
    console.log('Attempted to create or  join room', room);

    console.log('Getting user media with constraints', constraints);
    socket.emit('call attempt', room, e.target.id);
    gotStream(localStream);
    if (location.hostname !== 'localhost') {
      requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
      );
    }
  }
  if (e.target && e.target.classList.contains("hangupButton")){
    e.target.classList.remove("icofont-close-circled");
    e.target.classList.add("callButton", "icofont-phone-circle");
    e.target.style.backgroundColor = "green";
    socket.emit('ended call');
    stop();
  }
  if (e.target && e.target.classList.contains('answerButton')){
      socket.emit('create or join', CHATROOM);
      gotStream(localStream);
      let _light = document.querySelector("#light");
      _light.style.display = "none";
  }
})
function openLightBox () {
  document.getElementById('light').style.display='block';
  document.getElementById('fade').style.display='block';
}
function closeLightBox () {
  document.getElementById('light').style.display='none';
  document.getElementById('fade').style.display='none';
}
function logOut () {
  let _light = document.querySelector('#light');
  localvideo.srcObject = null;
  chatName = null;
  socket.emit('bye');
  _light.innerHTML = loggedOut;
}
function startCam () {
  if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({video: true})
    .then(function(stream) {
      _localvideo.srcObject = stream;
      localStream = stream;
    })
    .catch(function(error) {
      console.log("Something went wrong!");
    });
  }
}

var userList;
//updates online user list
socket.on('get users', function (data) {
  userList = " ";
  for (var user of data){
    if (user !== chatName){
      userList += `<div class="userPanel"><li class='user'>${user}<button  id=${user} class = "caller callButton icofont icofont-phone-circle" style="background-color:green;"></button></li>
                                                                                </div>`;
    }
    }

  userList.innerHTML = userList;
  onlineUsers();
});

function onlineUsers () {
  let _light = document.querySelector('#light');
  let _onlineList = document.querySelector("#onlineList");
  if (userList != undefined){
    _light.innerHTML = `<div id = "online">Online now:</div><br>
                           <div id = "userList">${userList}<div>`;
  }
}

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// socket listeners
socket.on('call over', function(){
  stop();
})
socket.on('created', function(room) {
  console.log('Created room ' + room);
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on('is calling', function(room){
  console.log('invite to join room ', room);
  CHATROOM = room;
  let _light = document.querySelector("#light");
  _light.innerHTML = `<div id="callNotify">${room} is calling</div><div id="callControl"><button style="background-color:green;" class="answerButton icofont icofont-check-circled"></button><button style="background-color:red;" class="hangupButton icofont icofont-close-circled"></button>`;
  //  socket.emit('create or join', room);
    console.log("one", room);
  //  gotStream(localStream);
    console.log("two", localStream);

})

socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localvideo.srcObject = stream;
  sendMessage('got user media');
  console.log("initiator", isInitiator, stream);
  if (isInitiator) {
    maybeStart();
  }
}

function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remotevideo.srcObject = remoteStream;
  remotevideo.classList.remove("remotevideo");
  remotevideo.classList.add("remotevideo--active");
  localvideo.classList.remove("localvideo");
  localvideo.classList.add("localvideo--active");
  let _fade = document.querySelector("#fade");
  let _light = document.querySelector("#light");
  closeLightBox();
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
  remotevideo.srcObject = null;
  remotevideo.classList.remove("remotevideo--active");
  remotevideo.classList.add("remotevideo");
  localvideo.classList.remove("localvideo--active");
  localvideo.classList.add("localvideo");
}
