const { signInWithEmailAndPassword } = require("firebase/auth");
const { auth } = require("./database.js");

function loadSignIn() {
    const signInForm = document.querySelector("form#sign-in");
    signInForm.onsubmit = (e) => handleSignIn(e, auth);

    async function handleSignIn(e, auth) {
        e.preventDefault();
        const { email, password } = e.target;
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email.value,
                password.value
            );
            window.location.href = "/admin";
        } catch (err) {
            alert("Wrong credentials!");
        }
    }
}

module.exports = { loadSignIn };
