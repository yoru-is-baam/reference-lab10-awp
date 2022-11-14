const socket = io();

const inboxPeople = document.querySelector(".inbox__people");
const inputField = document.querySelector(".message_form__input");
const messageForm = document.querySelector(".message_form");
const messageBox = document.querySelector(".messages__history");
const fallback = document.querySelector(".fallback");
const notify = document.getElementById("notify");
let _user = {};

const newUserConnected = (user) => {
  //userName = user || `User${Math.floor(Math.random() * 1000000)}`;
  _user = user
  socket.emit("new user", user);
  addToUsersBox(user);
};

const addToUsersBox = (user) => {
  if (!!document.querySelector(`.userlist-${user.id}`)) {
    return;
  }
  let tm = new Date()
  let time = tm.getHours()+":"+tm.getMinutes();
  let userBox = `
  <div class="user chat_ib userlist-${user.id}">
    <div class="avatar">C</div>
    <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="online">Truy cập lúc: ${time}'</div>
    </div>
    <div class="status">
        <div class="badge badge-success badge-pill">Đang rảnh</div>
    </div>
    </div>
  `;
  inboxPeople.innerHTML += userBox;
let htmlnoti = `
    <div class="alert alert-success d-inline position-fixed small" style="bottom: 20px; left: 20px;" id="notify-${user.id}">
        <strong>${user.name}</strong> vừa mới online
    </div>`
  notify.innerHTML += htmlnoti
  setTimeout("hide_noti('"+user.id+"')",2000)
};
function hide_noti(id){
    $('#notify-'+id).remove();
}
const addNewMessage = ({ user, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

  const receivedMsg = `
  <div class="message their-message">${message}
    <span class="time">${user.name} ${formattedTime}</span>
  </div>`;

  const myMsg = `
  <div class="message my-message">${message}
        <span class="time">${formattedTime}</span>
    </div>`;

  messageBox.innerHTML += user.id === _user.id ? myMsg : receivedMsg;
};
function send_message(){
    if (!inputField.value) {
    return;
  }

  socket.emit("chat message", {
    message: inputField.value,
    nick: _user,
    //sendto: ...
  });

  inputField.value = "";
}
messageForm.addEventListener("click", (e) => {
  e.preventDefault();
  send_message();
});

inputField.addEventListener("keyup", () => {
  socket.emit("typing", {
    isTyping: inputField.value.length > 0,
    nick: _user,
  });
});
inputField.addEventListener("keydown", (event) => {
    if (event.keyCode == 13) {
        send_message()
        return false 
    }
  });

socket.on("new user", function (data) {
  data.map((user) => addToUsersBox(user));
});

socket.on("user disconnected", function (user) {
  document.querySelector(`.userlist-${user.id}`).remove();
  /*
  <div id="offline-notification" class="alert alert-danger d-inline position-fixed small" style="bottom: 20px; right: 20px; ">
    <strong>Trần Quang Trí</strong> đã thoát khỏi ứng dụng
  </div>
  */
});

socket.on("chat message", function (data) {
  addNewMessage({ user: data.nick, message: data.message });
});


socket.on("typing", function (data) {
  const { isTyping, nick } = data;

  if (!isTyping) {
    fallback.innerHTML = "";
    fallback.style.display="none"
    return;
  }
  fallback.style.display=""
  fallback.innerHTML = `${nick.name} is typing...`;
});