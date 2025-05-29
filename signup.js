import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile ,GoogleAuthProvider,signInWithPopup } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyBSRtgbZ4_j-c339ecVhSYELH-9EuPSVfs",
  authDomain: "mindplay2005.firebaseapp.com",
  projectId: "mindplay2005",
  storageBucket: "mindplay2005.firebasestorage.app",
  messagingSenderId: "961633648306",
  appId: "1:961633648306:web:4c930b45a396ada0b853ab",
  measurementId: "G-3YK6DHL8K2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
// Wait for DOM to load before accessing elements
document.addEventListener("DOMContentLoaded", () => {
  const submit = document.getElementById("submit");

  submit.addEventListener("click", function (event) {
    event.preventDefault();
    
    // Get input values inside the event listener
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up 
        const user = userCredential.user;
        alert("Creating Account...")
        localStorage.setItem("loginuser", email);
        localStorage.setItem("loginemail", password);
        window.location.href="homepage/homepage.html"
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert(error)
        // ..
      });
  });
});


const google_signin = document.getElementById("GoogleSignin");
google_signin.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission
    console.log("Google Sign-In button clicked");

    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Google Sign-In successful");
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const user = result.user;
            console.log("Signed in as:", user.displayName);
            console.log(user.email);
            localStorage.setItem("userName", user.displayName);
            localStorage.setItem("userPhoto", user.photoURL);
            localStorage.setItem("userEmail", user.email);

            window.location.href = "homepage/homepage.html";
        })
        .catch((error) => {
            console.error("Google Sign-In Error:", error);
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Error Code:", errorCode);
            console.error("Error Message:", errorMessage);
        });
});
