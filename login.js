import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, updateProfile ,GoogleAuthProvider,signInWithPopup} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "API KEY",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

auth.languageCode = 'en';
const provider=new GoogleAuthProvider();

// Wait for DOM to load before accessing elements
document.addEventListener("DOMContentLoaded", () => {
  const submit = document.getElementById("submit");

  submit.addEventListener("click", function (event) {
    event.preventDefault();
    
    // Get input values inside the event listener
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    localStorage.setItem("loginuser", email);
    
    window.location.href="index.html"

    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
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
