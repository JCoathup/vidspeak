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
let CALLEE;
let userIndicator;
let isChannelReady = false;
let isInitiator = false;
let isStarted = false;
let pc;
let remoteStream;
let turnReady;
let userList;
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

document.addEventListener("click", (e) => {
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
      socket.on('duplicate username', (data) => {
        if (data == true) {
          _username.value="";
          _username.placeholder = "Username taken!";
          return;
        }
      });
      //no duplicate found... continue
      socket.emit('new user', _username.value, () => {
        chatName = _username.value;
        let loggedIn = `<div id ="loginText">You are logged in as: ${chatName}</div><div id = "loginPanel"><button id = "signOut">Logout</button></div>`;
        document.querySelector("#loginPanel").innerHTML = loggedIn;
        startCam();
      });
    }
  }
  if (e.target && e.target.id == "signOut"){
    logOut();
    hangup();
  }
  if (e.target && e.target.id == "users"){
    let _light = document.querySelector('#light');
    _light.innerHTML = `<div id = "onlineList"></div>`;
    onlineUsers();
    if (isStarted){
      if (CHATROOM == chatName){
        document.querySelector('.'+CALLEE+' button.callButton').style.display = "none";
        document.querySelector('.'+CALLEE+' button.hangupButton').style.display = "block";
      }
      else {
        document.querySelector('.'+CHATROOM+' button.callButton').style.display = "none";
        document.querySelector('.'+CHATROOM+' button.hangupButton').style.display = "block";
      }
    }
  }
  if (e.target && e.target.classList.contains("callButton")){
    isInitiator = true;
    console.log("Calling user...", e.target.id);
    CALLEE = e.target.id;
    let hangupButton = `<button style="background-color:red;" class="icofont hangupButton"></button>`;
    document.querySelector('.'+e.target.id+' button.callButton').style.display = "none";
    document.querySelector('.'+e.target.id+' button.hangupButton').style.display = "block";
    room = chatName;
    CHATROOM = room;
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
    let guest;
    if (isInitiator){
      guest = CALLEE;
    }
    else {
      guest = chatName;
    }
    socket.emit('ended call', CHATROOM, guest);
    stop();
  }
  if (e.target && e.target.classList.contains('answerButton')){
     console.log("I ANSWERED>>>>>>>>>");
      socket.emit('create or join', CHATROOM);
      gotStream(localStream);
      closeLightBox();
      console.log("ROOM IS NOW TODAY>>>>>>>>", CHATROOM, room);
      document.querySelector('.'+CHATROOM+' button.callButton').style.display = "none";
      document.querySelector('.'+CHATROOM+' button.hangupButton').style.display = "block";
  }
  if ((e.target && e.target.className == "localvideo--active") || (e.target && e.target.className == "remotevideo")){
    if (isStarted) {
      console.log ("switch...");
      remotevideo.classList.toggle("remotevideo");
      remotevideo.classList.toggle("remotevideo--active");
      localvideo.classList.toggle("localvideo");
      localvideo.classList.toggle("localvideo--active");
    }
  }
  if (e.target && e.target.id == "callRejectedButton"){
    console.log("REJECTED>>>>>>");
    let guest;
    if (isInitiator){
      guest = CALLEE;
    }
    else {
      guest = chatName;
    }
    socket.emit('call refused', CHATROOM, guest);
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
  _localvideo.srcObject = null;
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
    .catch((error) => {
      console.log("Something went wrong!");
    });
  }
}
//updates online user list
socket.on('get users', (data) => {
  userList = " ";
  for (var user of data){
    if (user !== chatName){
      userList += `<div class="userPanel">
                    <li class='user ${user}'>${user}
                      <button  id=${user} class = "callButton icofont icofont-phone-circle" style="background-color:green;"></button>
                      <button  class = "hangupButton icofont icofont-close-circled" style="background-color:red;"></button>
                      <button  class = "busyButton icofont icofont-exchange" style="background-color:orange;"></button>
                    </li>
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
socket.on('call rejected', () => {
  console.log("ENDING CONVO>>>>>");
  let _light = document.querySelector('#light');
  let _fade = document.querySelector('#fade');
  _fade.style.display = "none";
  _light.style.display = "none";
  stop();
})
socket.on('busy', (host, guest) => {
  document.querySelector('.'+host+' button.callButton').style.display = "none";
  document.querySelector('.'+host+' button.busyButton').style.display = "block";
  document.querySelector('.'+guest+' button.callButton').style.display = "none";
  document.querySelector('.'+guest+' button.busyButton').style.display = "block";
})
socket.on('call over', (host, guest) => {
  console.log("HOST AND GUEST>>>", host, guest);
  document.querySelector('.'+host+' button.busyButton').style.display = "none";
  document.querySelector('.'+host+' button.callButton').style.display = "block";
  document.querySelector('.'+guest+' button.busyButton').style.display = "none";
  document.querySelector('.'+guest+' button.callButton').style.display - "block";
})
socket.on('remote hangup', () => {
  stop();
})
socket.on('created', (room) => {
  console.log('Created room ' + room);
});
socket.on('full', (room) => {
  console.log('Room ' + room + ' is full');
});
socket.on('join', (room) => {
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});
socket.on('joined', (room) => {
  console.log('joined: ' + room);
  isChannelReady = true;
});
socket.on('log', (array) => {
  console.log.apply(console, array);
});
socket.on('is calling', (room) => {
  console.log('invite to join room ', room);
  CHATROOM = room;
  openLightBox();
  let _light = document.querySelector("#light");
  _light.innerHTML = `<div id="callNotify">${room} is calling</div><div id="callControl"><button style="background-color:green;" class="answerButton icofont icofont-check-circled"></button><button id="callRejectedButton" style="background-color:red;" class="callRejectedButton icofont icofont-close-circled"></button>`;
})
socket.on('message', (message) => {
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
  _localvideo.srcObject = stream;
  sendMessage('got user media');
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
window.onbeforeunload = () => {
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
  socket.emit('in call', CHATROOM, chatName);
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
    xhr.onreadystatechange = () => {
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
  _remotevideo.srcObject = remoteStream;
  _remotevideo.classList.remove("remotevideo");
  _remotevideo.classList.add("remotevideo--active");
  _localvideo.classList.remove("localvideo");
  _localvideo.classList.add("localvideo--active");
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
  isChannelReady =false;
  pc.close();
  pc = null;
  room = null;
  _remotevideo.srcObject = null;
  _remotevideo.classList.remove("remotevideo--active");
  _remotevideo.classList.add("remotevideo");
  _localvideo.classList.remove("localvideo--active");
  _localvideo.classList.add("localvideo");
  if (CHATROOM == chatName){
    document.querySelector('.'+CALLEE+' button.hangupButton').style.display = "none";
    document.querySelector('.'+CALLEE+' button.callButton').style.display = "block";
  }
  else {
    document.querySelector('.'+CHATROOM+' button.hangupButton').style.display = "none";
    document.querySelector('.'+CHATROOM+' button.callButton').style.display = "block";
  }
  closeLightBox();
  CHATROOM = null;
  isInitiator = false;
}
