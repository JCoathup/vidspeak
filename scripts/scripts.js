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
    userList += `<div class="userPanel"><li class='user'>${user}</li><button  id='${user}' class = "callButton icofont icofont-phone-circle" style="background-color:green;"></button>
                                                                              </div>`;
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
/*

var _remotevideo = document.querySelector("#remotevideo");
var _menu = document.querySelector("#menu");
var _toolbox = document.querySelector(".toolbox");
var _pallette = document.querySelector(".pallette");
var _navigation = document.querySelector(".navigation");

var loggedIn; var loggedOut;
var room;

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;

var pc;
var remoteStream;
var turnReady;

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

var constraints = {
  video: true
};

document.addEventListener("click", function (e) {
  //handles end call procedure
  if (e.target && e.target.classList.contains("hangupButton")){
    let hangupButton1 = e.target.previousElementSibling;
    let hangupButton = hangupButton1.previousElementSibling;
    removeDuringCallButtons(hangupButton.id);
    socket.emit('ended call');
    stop();
  }
  //handles logout procedure

  if (e.target && e.target.id == "menu"){
    var _subMenu = document.querySelectorAll(".subMenu");
    for (var item of _subMenu){
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


  var _signIn = document.querySelector("#signIn");
  var _username = document.querySelector("#username");
  //var chatName;

})

function openpallette(){
  _pallette.classList.toggle('pallette--active');
  _navigation.classList.toggle('nav--move');
}

function menuChecker(e){
  if (e.target && e.target.classList.contains("subMenu")) {
    var _subMenu = document.querySelectorAll(".subMenu");
    for (var item of _subMenu){
      if (item.classList.contains("button--active") && (item != e.target)){
        item.classList.remove("button--active");
        e.target.classList.toggle("button--active");
        return;
      }
    }
    e.target.classList.toggle("button--active");
    openpallette();
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



//handles sending message to Server
function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}



document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("callButton")){
    isInitiator = true;
    console.log("Calling user...", e.target.id);
    room = chatName;
    removeCallButtons();
    duringCallButtons(e.target.id);
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
  if (e.target && e.target.classList.contains('answerButton')){
      let callroom = e.target.previousElementSibling;
      socket.emit('create or join', callroom.id);
      gotStream(localStream);
      removeCallAndRejectButtons(callroom.id);
      duringCallButtons(callroom.id);
  }
})

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
  removeCallButtons();
  addCallAndRejectButtons(room);
  //  socket.emit('create or join', room);
    console.log("one", room);
  //  gotStream(localStream);
    console.log("two", localStream);

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
  removeDuringCallButtons();
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
  replaceCallButtons();
  removeCallAndRejectButtons();
  removeDuringCallButtons();
}

//handles buttons before, during and after calls
function removeCallButtons () {
  let callButton = document.querySelectorAll('.userPanel button.callButton')
  for (let x= 0; x< callButton.length; x++){
    callButton[x].style.display = "none";
  }
}
function replaceCallButtons () {
  let callButton = document.querySelectorAll('.userPanel button.callButton')
  for (let x= 0; x< callButton.length; x++){
    callButton[x].style.display = "inline-block";
  }
}
function addCallAndRejectButtons (room) {
  let answerButton = document.querySelector('button#'+room+' ~ button.answerButton');
  let hangupButton = document.querySelector('button#'+room+' ~ button.hangupButton');
  answerButton.style.display = "inline-block";
  hangupButton.style.display = "inline-block";
}
function removeCallAndRejectButtons (room) {
  let answerButton = document.querySelector('button#'+room+' ~ button.answerButton');
  let hangupButton = document.querySelector('button#'+room+' ~ button.hangupButton');
  answerButton.style.display = "none";
  hangupButton.style.display = "none";
}
function duringCallButtons (room) {
  let hangupButton = document.querySelector('button#'+room+' ~ button.hangupButton');
  let busyButton = document.querySelector('button#'+room+' ~ button.busyButton');
  hangupButton.style.display = "inline-block";
  busyButton.style.display = "inline-block";
}
function removeDuringCallButtons (room) {
  let hangupButton = document.querySelector('button#'+room+' ~ button.hangupButton');
  let busyButton = document.querySelector('button#'+room+' ~ button.busyButton');
  hangupButton.style.display = "none";
  busyButton.style.display = "none";
}
*/
