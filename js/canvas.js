/* global players: false, myId: false, bombs: false, bullets: false, lastKill: true, lastKillTimeout: true, isDead: false, blocks: false, resetTime: false */

const sha1 = str => {
  // We transform the string into an arraybuffer.
  let buffer = new TextEncoder("utf-8").encode(str);
  return crypto.subtle.digest("SHA-1", buffer).then(function (hash) {
    return hex(hash);
  });
};

const hex  = buffer =>  {
  let hexCodes = [];
  let view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    let value = view.getUint32(i);
    // toString(16) will give the hex representation of the number without padding
    let stringValue = value.toString(16);
    // We use concatenation and slice for padding
    let padding = "00000000";
    let paddedValue = (padding + stringValue).slice(-padding.length);
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
};

let lastHash;


const leaderboard = document.querySelector("#leaderboard");

let kill = false;

let canvasWidth = innerWidth;
let canvasHeight = innerHeight;

const translateCanvas = (x, y, width, height, canvasWidth, canvasHeight, ctx) => {
  const xToTranslate = Math.round(-(Math.floor(x) + (width / 2) - (canvasWidth / 2)));
  const yToTranslate = Math.round(-(Math.floor(y) + (height / 2) - (canvasHeight / 2)));
  ctx.translate(xToTranslate, yToTranslate);
};

const game = (map) => {//eslint-disable-line no-unused-vars
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  const setSize = () => {
    canvasWidth = Math.min(outerWidth, innerWidth);
    canvasHeight = Math.min(outerHeight, innerHeight);
    canvas.setAttribute("width", canvasWidth.toString());
    canvas.setAttribute("height", canvasHeight.toString());
  };
  onresize = setSize;
  setSize();

  let hasLived = false;

  const TARGET_MS = 1000 / 30;

  const dead = () => {
    console.log("dead");
    ctx.clearRect(0, 0, 3000, 5000);
    document.querySelector("#game").setAttribute("hidden", "hidden");
    document.querySelector("#respawn").removeAttribute("hidden");
    document.querySelector("#reset").setAttribute("hidden", "hidden");
    return;
  };

  const draw = function(){
    let start = performance.now();
    if(isDead) return dead();
    let player = players.filter(player => player.id === myId)[0];
    if(!player){
      if(hasLived){
        console.log("could not find self");
        //return dead();
      }
    }else{
      hasLived = true;

      ctx.clearRect(0, 0, 3000, 5000);
      ctx.save();
      translateCanvas(Math.floor(player.x), Math.floor(player.y), player.width, player.height, canvasWidth, canvasHeight, ctx);

      const translateX = Math.round(player.x + (player.width / 2) - (canvasWidth / 2));
      const translateY = Math.round(player.y + (player.height / 2) - (canvasHeight / 2));

      blocks.forEach(block => {
        if(
          block[0] + block[2] < translateX ||
          block[1] + block[3] < translateY ||
          block[0] - block[2] > (translateX + canvasWidth + block[2]) ||
          block[1] - block[3] > (translateY + canvasHeight + block[3])
        ){
          return;
        }

        if(block[4]){
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-1") || "gray";
        }else{
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color").trim() || "black";
        }

        ctx.fillRect(block[0], block[1], block[2], block[3]);
      });
      bombs.forEach(bomb => {
        if(
          bomb.x + bomb.size < translateX ||
          bomb.y + bomb.size < translateY ||
          bomb.x - bomb.size > (translateX + canvasWidth) ||
          bomb.y - bomb.size > (translateY + canvasHeight)
        ){
          return;
        }
        ctx.fillStyle = bomb.fillStyle || "gray";
        ctx.beginPath();
        ctx.arc(bomb.x + 10, bomb.y + 10, bomb.size, 0, Math.PI * 2, true);
        ctx.fill();
      });
      bullets.forEach(bullet => {
        if(
          bullet.x + bullet.size < translateX ||
          bullet.y + bullet.size < translateY ||
          bullet.x - bullet.size > (translateX + canvasWidth) ||
          bullet.y - bullet.size > (translateY + canvasHeight)
        ){
          return;
        }
        ctx.fillStyle = bullet.fillStyle || "gray";
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2, true);
        ctx.fill();
      });
      players.forEach(player => {
        if(
          player.x + player.width < translateX ||
          player.y + player.height < translateY ||
          player.x - player.width > (translateX + canvasWidth) ||
          player.y - player.height > (translateY + canvasHeight)
        ){
          return;
        }
        ctx.fillStyle = player.fillColor;
        ctx.fillRect(player.x, player.y, player.width || 20, player.height || 20);
        ctx.fillStyle = "gray";
        const slice = 3;
        switch(player.direction){
        case "up":
          ctx.fillRect(player.x, player.y, player.width, player.height / slice);
          break;
        case "down":
          ctx.fillRect(player.x, player.y + (player.height - player.height / slice), player.width, player.height / slice);
          break;
        case "left":
          ctx.fillRect(player.x, player.y, player.width / slice, player.height);
          break;
        case "right":
          ctx.fillRect(player.x + (player.width - player.width / slice), player.y, player.width / slice, player.height);
          break;
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.font = "15px Roboto, \"Open Sans\", sans-serif";
        ctx.lineWidth = "3";
        ctx.strokeStyle = "white";
        ctx.strokeText(player.username, player.x + (player.width / 2), player.y);
        ctx.fillStyle = "black";
        ctx.fillText(player.username, player.x + (player.width / 2), player.y);
      });
      ctx.restore();
    }

    if(resetTime){
      document.querySelector("#reset").removeAttribute("hidden");
      const seconds = (new Date(resetTime)).getTime() / 1000 - Date.now() / 1000;
      if(seconds >= 0){
        document.querySelector("#reset-seconds").innerText = (seconds).toFixed(2);
      }else{
        document.querySelector("#reset").setAttribute("hidden", "hidden");
      }
    }

    let elapsed = performance.now() - start;

    if(!kill){
      if(TARGET_MS - elapsed < 1) {
        console.warn("Frame skipping!!");
        return requestAnimationFrame(draw);
      }
      setTimeout(() => requestAnimationFrame(draw), TARGET_MS - elapsed);
    }
  };
  requestAnimationFrame(draw);

  setInterval(() => {
    lastKillTimeout --;
    if(lastKillTimeout < 1){
      lastKill = "";
    }

    let html = `<table>
    	<thead>
    			<tr>
    					<td>Player</td>
    					<td>Kills</td>
    			</tr>
    	</thead>
    <tbody>`;
    players.sort((player1, player2) => player1.id - player2.id).sort((player1, player2) => player2.killStreak - player1.killStreak).slice(0, 10).forEach(player => {
      html += `<tr>
					 <td>${player.username}</td>
				   <td>${player.killStreak}</td>
  			</tr>
			`;
    });
    html += "</tbody></table>";

    sha1(html).then(hash => {
      if(hash === lastHash) return;
      if(leaderboard.children[0]) leaderboard.children[0].remove();
      if(leaderboard.children[0]) leaderboard.children[0].remove();
      const table = document.createElement("table");
      table.innerHTML = html;
      leaderboard.appendChild(table);
      lastHash = hash;
    });

    const elem = document.querySelector("#last-kill");
    if(elem && elem.innerText === lastKill) return;
    if(elem) elem.remove();
    const div = document.createElement("div");
    div.setAttribute("id", "last-kill");
    div.innerText = lastKill;
    leaderboard.appendChild(div);
  }, 250);
};
