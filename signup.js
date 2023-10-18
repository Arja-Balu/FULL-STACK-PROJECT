// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDPItEXR_QWN60GuMLS57s7ptVYti5XVgY",
    authDomain: "find-my-book-3a2f8.firebaseapp.com",
    projectId: "find-my-book-3a2f8",
    storageBucket: "find-my-book-3a2f8.appspot.com",
    messagingSenderId: "676583618370",
    appId: "1:676583618370:web:2d423424232b20579cbadb"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore reference
const db = firebase.firestore();

const form = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    console.log("Form submission triggered");

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        console.log('User signed up:', userCredential.user);
        
        // Store the user data in Firestore
        const user = userCredential.user;
        const username = document.getElementById('username').value;

        // Add user data to Firestore
        return db.collection("users").doc(user.uid).set({
            username: username,
            email: user.email
        });
    })
    .then(() => {
        alert("Signup successful and user data saved!");
        window.location.href = "login.html";  // Redirect to the login page
    })
    .catch((error) => {
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                alert('The email address is already in use by another account.');
                break;
            case 'auth/weak-password':
                alert('The password is too weak. Please choose a stronger password.');
                break;
            // You can add more cases for other error codes as needed.
            default:
                alert(error.message);
                break;
        }

        errorMessage.textContent = error.message;
    });
});
