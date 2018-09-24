/* global firebase: false */

let token;//eslint-disable-line no-unused-vars

// Initialize Firebase
/*let config = {
  apiKey: "AIzaSyDrlVVk0-hwsDkclxHDflWNxTxyYVjTUPA",
  authDomain: location.host,
  databaseURL: "https://bomb-game.firebaseio.com",
  projectId: "bomb-game",
  storageBucket: "bomb-game.appspot.com",
  messagingSenderId: "192692746305"
};
firebase.initializeApp(config);*/

const $ = x => document.querySelector(x);

const updateUsername = () => {
  if(!firebase.auth().currentUser) return;

  db.collection("users").doc(firebase.auth().currentUser.id).onSnapshot(function(doc) {
    console.log("Current data: ", doc.data());
    const username = doc.data().username;
    if(!username) return;
    document.querySelectorAll(".username").forEach(elem => elem.innerText = username);
  });
};

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

    firebase.auth().currentUser.getIdToken().then(newToken => token = newToken).catch(e => console.error("token", e));
    $("#signed-out").setAttribute("hidden", "hidden");
    $("#signed-in").removeAttribute("hidden");

    const img = $("#profile").querySelector("img");
    img.src = user.photoURL;

    $("#no-account-play").setAttribute("hidden", "hidden");
    $("#account-play").removeAttribute("hidden");

    updateUsername();
  } else {
    // User is signed out.
    console.log("SIGNED OUT");
    $("#signed-out").removeAttribute("hidden");
    $("#signed-in").setAttribute("hidden", "hidden");
    $("#no-account-play").removeAttribute("hidden");
    $("#account-play").setAttribute("hidden", "hidden");
  }
});

$("button#sign-out").onclick = () => {
  firebase.auth().signOut();
  token = undefined;
};
document.querySelectorAll(".sign-in").forEach(button => button.onclick = () => {
  Error.stackTraceLimit = 30;
  console.log(button);
  firebase.auth().signInWithPopup(new firebase.auth[button.dataset.authName + "AuthProvider"]()).then(() => {
    const currentUser = firebase.auth().currentUser;
    const isNewUser = currentUser.metadata.creationTime === currentUser.metadata.lastSignInTime;
    if(!isNewUser) return;

    $("#username-modal").removeAttribute("hidden");
  }).catch(e => {
    console.error("Could not sign in / sign up to", button.dataset.authName, "because i got", e, e.code);
  });
});

const db = firebase.firestore();
db.settings({timestampsInSnapshots: true});

$("#set-username-form").onsubmit = e => {
  e.preventDefault();
  db.collection("users").doc(firebase.auth().currentUser.uid).set({username: $("#set-username").value.trim()}).then(() => {
    $("#username-modal").setAttribute("hidden", "hidden");
    updateUsername();
  }).catch(console.error);
};

$("#change-username").onclick = () => $("#username-modal").removeAttribute("hidden");
