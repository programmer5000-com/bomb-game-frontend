/* global game: false */
let socket;
let players = [];//eslint-disable-line no-unused-vars
let bullets = [];//eslint-disable-line no-unused-vars

let myId = null;//eslint-disable-line no-unused-vars


const convertBase = (value, from_base, to_base) => {
  value = value.toString();
  var range = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
  var from_range = range.slice(0, from_base);
  var to_range = range.slice(0, to_base);

  var dec_value = value.split("").reverse().reduce(function (carry, digit, index) {
    if (from_range.indexOf(digit) === -1) throw new Error("Invalid digit `"+digit+"` for base "+from_base+".");
    return carry += from_range.indexOf(digit) * (Math.pow(from_base, index));
  }, 0);

  var new_value = "";
  while (dec_value > 0) {
    new_value = to_range[dec_value % to_base] + new_value;
    dec_value = (dec_value - (dec_value % to_base)) / to_base;
  }
  return new_value || "0";
};

const parseResponse = str => {
  const parts = [];
  const players = [];
  const bullets = [];
  let isPlayer = true;

  str.split("").forEach(char => {
    if(char === "!" || char === "?"){
      parts.push(char);
    }else{
      parts[parts.length - 1] += char;
    }
  });
  parts.forEach(part => {
    if(part[0] === "?") isPlayer = false;

    const values = part.slice(1).split("=");
    if(isPlayer){
      players.push({
        x: parseInt(convertBase(values[0], 64, 10)),
        y: parseInt(convertBase(values[1], 64, 10)),
        id: parseInt(convertBase(values[2], 64, 10)),
        width: 20,
        height: 20
      });
    }else{
      bullets.push({
        x: parseInt(convertBase(values[0], 64, 10)),
        y: parseInt(convertBase(values[1], 64, 10)),
        size: 5
      });
    }
  });

  return {players, bullets};
};

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
      if(!e.data.trim()) return;
      if(e.data[0] === "!"){
        const parsed = parseResponse(e.data);
        players.forEach(player => {
          parsed.players = parsed.players.filter(player2 => {
            if(player.id === player2.id){
              player = Object.assign({}, player, player2);
            }
          });
        });
        bullets = parsed.bullets;
        return;
      }
      JSON.parse(e.data).forEach(data => {
        try{
          let playerToRemove;
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
              // console.log("Players are", players);
            }
            tickCounter ++;
            break;
          case "newUser":
            players.push(data.data);
            break;
          case "removePlayer":
            players.some(player => {
              if(player.id === data.data){
                playerToRemove = player;
              }
            });
            players.splice(players.indexOf(playerToRemove), 1);
            break;
          default:
            throw new Error("Unknown WS protocol type", "\"", data.type, "\"");
          }
        }catch(err){
          console.error("Unexpected error in message processing", err, data);
        }
      });
    }catch(err){
      console.error("Unexpected error in JSON parsing", err, "\"", e.data, "\"");
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
