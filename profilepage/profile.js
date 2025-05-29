
// import {signOut } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";


// Get stored user info from local storage
const userName = localStorage.getItem("userName");
const userPhoto = localStorage.getItem("userPhoto");
const userEmail = localStorage.getItem("userEmail");

const loginuser = localStorage.getItem("loginuser");

// Check if user is logged in
if (userName) {
    document.getElementById("profile-name").innerText = `Welcome, ${userName}`;
    document.getElementById("profile-pic").src = userPhoto;
    document.getElementById("profile-email").innerText = ` ${userEmail}`;
} 
else if (loginuser) {
    document.getElementById("profile-name").innerText = `Welcome, ${loginuser}`;
    document.getElementById("profile-pic").remove()
    
}else {
    // Redirect back to login page if no user data
    window.location.href = "../signin.html";
}

document.getElementById("logout").addEventListener("click",function () {
 localStorage.removeItem("userName");
 localStorage.removeItem("userPhoto");
 localStorage.removeItem("userEmail");
 window.location.href="../login.html"
})

