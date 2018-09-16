/* global firebase: false */


// Initialize Firebase
var config = {
  apiKey: "AIzaSyDrlVVk0-hwsDkclxHDflWNxTxyYVjTUPA",
  authDomain: "bomb-game.firebaseapp.com",
  databaseURL: "https://bomb-game.firebaseio.com",
  projectId: "bomb-game",
  storageBucket: "bomb-game.appspot.com",
  messagingSenderId: "192692746305"
};
firebase.initializeApp(config);

const $ = x => document.querySelector(x);

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;

    console.log("SIGNED IN", {displayName, email, emailVerified, photoURL, isAnonymous, uid, providerData});

    firebase.auth().currentUser.getIdToken().then(console.log);
    $("#signed-out").setAttribute("hidden", "hidden");
    $("#signed-in").removeAttribute("hidden");

    const text = $("#profile").querySelector("span");
    text.innerText = displayName;

    const img = $("#profile").querySelector("img");
    img.src = user.photoURL;
  } else {
    // User is signed out.
    console.log("SIGNED OUT");
    $("#signed-out").removeAttribute("hidden");
    $("#signed-in").setAttribute("hidden", "hidden");
  }
});

$("button#sign-out").onclick = () => firebase.auth().signOut();
document.querySelectorAll(".sign-in").forEach(button => button.onclick = () => {
  console.log(button);
  firebase.auth().signInWithPopup(new firebase.auth[button.dataset.authName + "AuthProvider"]());
});
