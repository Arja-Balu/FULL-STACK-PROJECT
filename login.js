// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDPItEXR_QWN60GuMLS57s7ptVYti5XVgY",
    authDomain: "find-my-book-3a2f8.firebaseapp.com",
    projectId: "find-my-book-3a2f8",
    storageBucket: "find-my-book-3a2f8.appspot.com",
    messagingSenderId: "676583618370",
    appId: "1:676583618370:web:2d423424232b20579cbadb"
};
firebase.initializeApp(firebaseConfig);

const form = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        console.log('User logged in:', userCredential.user);
        alert("login successfull");
        window.location.href = "index.html";  // Redirect to the main page
    })
    .catch((error) => {
        alert("invalid email/password");
    });
});
