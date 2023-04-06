import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./database.js";

export default function loadSignIn() {
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
            window.location.href = "/admin.html";
        } catch (err) {
            alert(err);
        }
        return;
    }
}
