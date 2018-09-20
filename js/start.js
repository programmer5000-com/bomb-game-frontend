const elem = document.querySelector("#username");

const chars = [];
for(let i = 32; i < 127; i++){
  chars.push(String.fromCharCode(i));
}

setInterval(() => {
  const charArr = elem.placeholder.split("");
  charArr.forEach((char, idx) => {
    const charIdx = (chars.indexOf(char) + chars.length / 5) % chars.length;
    charArr[idx] = chars[charIdx];
  });
  elem.placeholder = charArr.join("");
}, 100);
