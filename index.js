/* global game: false */
let socket;
let players = [];//eslint-disable-line no-unused-vars
let bullets = [];//eslint-disable-line no-unused-vars

let myId = null;//eslint-disable-line no-unused-vars

const input = document.querySelector("#host");
input.onkeypress = e => {
  if(e.key === "Enter"){
    let host = input.value.trim();
    if(!host.includes(":")){
      host += ":5000";
    }
    document.querySelector("canvas").removeAttribute("hidden");
    document.querySelector("p").setAttribute("hidden", "hidden");
    console.log("Connecting to ws://" + host);
    newGame(host);
  }
};

const newGame = host => {
  socket = new WebSocket("ws://" + host);
  socket.onopen = () => {
    console.log("[socket] connected");
    send({type: "hello", data: {}});
  };

  let tickCounter = 0;


  socket.onmessage = (e) => {
    try{
      JSON.parse(e.data).forEach(data => {
        try{
          switch(data.type){
          case "map":
            console.log("got map", data.data);
            game(data.data);
            break;
          case "playerinfo":
            console.log("info about me", data.data);
            myId = data.data.id;
            break;
          case "tick":
            players = data.data.players;
            bullets = data.data.bullets;
            if(tickCounter % 120 === 0){
              console.log("Players are", players);
            }
            tickCounter ++;
            break;
          default:
            throw new Error("Unknown WS protocol type", data.type);
          }
        }catch(err){
          console.error("Unexpected error in message processing", err);
        }
      });
    }catch(err){
      console.error("Unexpected error in JSON parsing", err);
    }
  };

  const send = (...data) => {
    if(!socket) return;
    socket.send(JSON.stringify(data));
  };

  onkeydown = e => {
    if(["w", "a", "s", "d"].includes(e.key.toLowerCase())){
      send({type: "keyDown", data: e.key.toLowerCase()});
    }
  };
  onkeyup = e => {
    if(["w", "a", "s", "d"].includes(e.key.toLowerCase())){
      send({type: "keyUp", data: e.key.toLowerCase()});
    }
  };
  onkeypress = e => {
    if(e.key === " "){
      send({type: "keyPress", data: "q"});
    }
  };
};
