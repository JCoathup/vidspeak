var socket = io.connect();
let _localvideo = document.querySelector("#localvideo");
let _remotevideo = document.querySelector("#remotevideo");
let _menu = document.querySelector("#menu");
let _toolbox = document.querySelector(".toolbox");
let _pallette = document.querySelector(".pallette");
let _navigation = document.querySelector(".navigation");
let chatName = null;
let loggedIn; let loggedOut;
let room;

let isChannelReady = false;
let isInitiator = false;
let isStarted = false;
let localStream;
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

document.addEventListener("click",  (e) => {
  if (e.target && e.target.id == "menu"){
    let _subMenu = document.querySelectorAll(".subMenu");
    for (let item of _subMenu){
      if (item.classList.contains("button--active")){
      // if menu already open then close main menu
      item.classList.remove("button--active");
      _pallette.innerHTML = " ";
      _navigation.classList.remove('nav--move');
      _pallette.classList.remove('pallette--active');
      }
    }
    //else menu is closed then open main menu
    _menu.classList.toggle('menu--active');
    _toolbox.classList.toggle('toolbox--active');
  }
  if (e.target && e.target.id == "login"){
    menuChecker(e);
    loggedIn = `<div id ="loginText">You are logged in as: ${chatName}</div><div id = "loginPanel"><button id = "signOut">Logout</button></div>`;
    loggedOut = `<div id ="loginText">Choose a username</div>
                    <div id = "loginPanel">
                       <input id = "username" placeholder = "connect"/>
                       <button id = "signIn">Connect</button>
                     </div>`;
    if (_pallette.classList.contains("pallette--active")){
      if(chatName == null){
        _pallette.innerHTML = loggedOut;
      }
      else {
        _pallette.innerHTML = loggedIn;
      }
    }
    else {
      _pallette.innerHTML = " ";
    }
  }
  if (e.target && e.target.id == "users"){
        menuChecker(e);
  if (_pallette.classList.contains("pallette--active")){
    _pallette.innerHTML = `<div id = "onlineList"></div>`;
    onlineUsers();
  } else {
    _pallette.innerHTML = " ";
  }
}
  if (e.target && e.target.id == "youtube"){
    menuChecker(e);
  }
  let _signIn = document.querySelector("#signIn");
  let _username = document.querySelector("#username");
  //let chatName;
if (e.target && e.target.id == "signIn"){
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
      document.querySelector("#loginPanel").innerHTML = loggedIn;
      chatName = _username.value;
      startCam();
    });
  }
}

})

function openPallette(){
  _pallette.classList.toggle('pallette--active');
  _navigation.classList.toggle('nav--move');
}

function menuChecker(e){
  if (e.target && e.target.classList.contains("subMenu")) {
    let _subMenu = document.querySelectorAll(".subMenu");
    for (let item of _subMenu){
      if (item.classList.contains("button--active") && (item != e.target)){
        item.classList.remove("button--active");
        e.target.classList.toggle("button--active");
        return;
      }
    }
    e.target.classList.toggle("button--active");
    openPallette();
  }
}
////////////////////////////////////////////////
// user login and display online users
////////////////////////////////////////////////

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

function onlineUsers () {
  let _onlineList = document.querySelector("#onlineList");
  if (userList != undefined){
    _pallette.innerHTML = `<div id = "online">Online now:</div><br>
                           <div id = "userList">${userList}<div>`;
  }
}

//handles sending message to Server
function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

let userList;
//updates online user list
socket.on('get users', (data) => {
  userList = " ";
  for (let user of data){
    userList += `<li class='user'>${user}</li><button id = ${user} class = "callButton" style="position:relative; float:left; height:3.5vh; background-color:green; font-size:12px; color:#fff; width:15%; display: inline-block;">&#xefba;</button><button class="hangupButton icofont icofont-close-circled" style="position:relative; float:left; height:3.5vh; background-color:red; font-size:12px; color:#fff; width:15%; display: inline-block;">Hangup</button>`;
  }
  userList.innerHTML = userList;
  onlineUsers();
});

document.addEventListener("click", (e) => {
  if (e.target && e.target.className == "callButton"){
    isInitiator = true;
    console.log("Calling user...", e.target.id);
    room = chatName;

    //sendMessage('attempting call', room);
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
})

// socket listeners
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
  //isInitiator = false;
    socket.emit('create or join', room);
    gotStream(localStream);
})
// This client receives a message from server
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
