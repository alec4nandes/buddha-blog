import {
    addDraft,
    addPost,
    getAllDrafts,
    getAllPosts,
    getDraft,
} from "./read-write.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { auth } from "./database.js";

// AUTHENTICATION

displayPosts();

async function displayPosts() {
    // root directory: show posts
    if (location.pathname == "/") {
        const posts = await getAllPosts(),
            displayElem = document.querySelector("#posts");
        displayElem.innerHTML = `<pre><xmp>${JSON.stringify(
            posts,
            null,
            4
        )}</xmp></pre>`;
    }
}

if (window.location.href.includes("/admin.html")) {
    onAuthStateChanged(getAuth(), async (user) => {
        try {
            // With the correctly set Firestore permissions,
            // listDrafts will throw an access error when admin
            // is not logged in. Catch this error and redirect
            // to sign-in.html
            await listDrafts();
            await loadDraft();
            const findSutta = document.querySelector("#find-sutta");
            findSutta &&
                (findSutta.onsubmit = (e) => {
                    e.preventDefault();
                    const suttaId = e.target.sutta.value;
                    loadSutta(suttaId);
                });
            document.querySelector("#edit-post-container").style.display =
                "flex";
        } catch (err) {
            // alert(err);
            window.location.href = "/sign-in.html";
        }
    });

    const signOutButton = document.querySelector("button#sign-out");
    signOutButton.onclick = () => handleSignOut(auth);

    async function handleSignOut(auth) {
        await signOut(auth);
        document.cookie = await makeCookie();
        window.location.href = "/";
    }

    /*** ADMIN.HTML - EDIT POSTS ***/

    async function loadDraft() {
        const params = new URL(document.location).searchParams,
            id = params.get("id"),
            draft = id && (await getDraft(id)),
            suttaId = id?.split(":")[0];
        if (draft) {
            await loadSutta(suttaId, draft.sutta);
            const editPost = document.querySelector("#edit-post");
            Object.entries(draft.post).forEach(
                ([name, value]) => (editPost[name].value = value)
            );
        }
    }

    async function listDrafts() {
        const draftIds = (await getAllDrafts()).map((draft) => draft.id),
            footer = document.querySelector("footer");
        footer &&
            (footer.innerHTML =
                "DRAFTS: " +
                (draftIds.length
                    ? draftIds
                          .map((id) => `<a href="?id=${id}">${id}</a>`)
                          .join(", ")
                    : "n/a"));
    }

    async function loadSutta(suttaId, sutta) {
        let postSutta =
            sutta ||
            (await (
                await fetch(`https://fern.haus/sutta/?sutta=${suttaId}`)
            ).json());

        displayDraftLines(postSutta);

        document.querySelector("#clear-to-annotate").onclick = () => {
            displayDraftLines(postSutta);
            toggleAnnotationForm(true);
        };

        document.querySelector("#annotate").onsubmit = (e) =>
            handleAnnotate(e, postSutta);

        document.querySelector("#edit-post").onsubmit = async (e) => {
            e.preventDefault();
            const post = Object.fromEntries(new FormData(e.target)),
                draft = { post, sutta: postSutta },
                type = e.target.type.value,
                isPost = type === "post";
            try {
                // upload draft regardless:
                const id = await addDraft(draft);
                isPost && (await addPost(draft));
                alert(`${type} uploaded!`);
                window.location.href = `?id=${id}`;
            } catch (err) {
                alert(err);
            }
        };
    }

    function displayDraftLines(postSutta) {
        const linesElem = document.querySelector("#lines");
        linesElem.innerHTML = postSutta.display.linesHTML;
        addAnnotationJumpButtons(postSutta);
    }

    function toggleAnnotationForm(enabled) {
        document.querySelector("#clear-to-annotate").disabled = enabled;
        document
            .querySelector("#annotate")
            .querySelector("button[type='submit']").disabled = !enabled;
    }

    function handleAnnotate(e, postSutta) {
        e.preventDefault();
        const lines = document.querySelector("#lines"),
            annotation = getAnnotation(e.target.note.value, postSutta);
        if (annotation) {
            postSutta.display.annotations =
                postSutta.display.annotations.filter(
                    (oldAnno) => !isOverlapped(oldAnno, annotation)
                );
            const { annotations } = postSutta.display;
            annotations.push(annotation);
            lines.innerHTML = highlightAnnotation(
                annotations.length,
                postSutta
            );
            toggleAnnotationForm(false);
            addAnnotationJumpButtons(postSutta);
        }
    }

    /*
        Returns annotation data for the displayed sutta if
        there's a valid selection, returns undefined otherwise.
        This method uses the DOM, so the browser's displayed
        sutta HTML in div#lines needs to match the HTML in
        postSutta.display.linesHTML
    */
    function getAnnotation(note) {
        const selection = window.getSelection(),
            selectionString = selection.toString(),
            // no spaces or line breaks as annotations:
            hasSelection = !!selectionString.trim();
        if (hasSelection) {
            const children = [...document.querySelector("#lines").childNodes],
                { anchorNode, anchorOffset, focusNode, focusOffset } =
                    selection,
                anchorIndex = children.indexOf(anchorNode),
                focusIndex = children.indexOf(focusNode),
                hasFocus = focusIndex !== -1,
                isBackwards =
                    hasFocus &&
                    (focusIndex < anchorIndex ||
                        (focusIndex === anchorIndex &&
                            focusOffset < anchorOffset)),
                startsWithBreak = selectionString.charAt(0) === "\n",
                // ^ No anchor or focus node index, so first contained
                // node will be <br/>. Move past this node to next text:
                extraIndexes = startsWithBreak ? 2 : 0,
                firstIndex =
                    children.findIndex((node) => selection.containsNode(node)) +
                    extraIndexes,
                isFirstNode = !firstIndex,
                finalBreak = startsWithBreak || isFirstNode ? "" : "<br/>",
                upTo =
                    children
                        .slice(0, firstIndex)
                        .map((node) => node.textContent)
                        .filter(Boolean)
                        .join("<br/>") + finalBreak,
                offset = startsWithBreak
                    ? 0
                    : isBackwards
                    ? focusOffset
                    : anchorOffset,
                start = upTo.length + offset,
                text = selectionString.split("\n").join("<br/>");
            // for testing:
            console.log(
                "anchor node:",
                anchorNode,
                "anchor index:",
                anchorIndex,
                "anchor offset:",
                anchorOffset,
                "focus node:",
                focusNode,
                "focus index:",
                focusIndex,
                "focus offset:",
                focusOffset
            );
            return {
                text,
                start,
                note: note.trim(),
            };
        }
    }

    // if you highlight an already highlighted section
    function isOverlapped(oldAnnotation, newAnnotation) {
        const { text: oldText, start: oldStart } = oldAnnotation,
            { text: newText, start: newStart } = newAnnotation;
        return (
            (oldStart <= newStart && newStart <= oldStart + oldText.length) ||
            (newStart <= oldStart &&
                oldStart + oldText.length <= newStart + newText.length)
        );
    }

    function highlightAnnotation(number, postSutta) {
        const { annotations } = postSutta.display,
            { start, text, note } = annotations[number - 1],
            { spanOpenTag, spanCloseTag } = getTags(number, note);
        return spliceLines({
            start,
            text,
            spanOpenTag,
            spanCloseTag,
            linesHTML: postSutta.display.linesHTML,
        });
    }

    function getTags(index, note) {
        const spanOpenTag = `<span id="a-${index}" class="highlighted">`,
            noteTag =
                note && ` <small class="note-display">${note}</small>&nbsp;`,
            spanCloseTag = `${noteTag || ""}</span>`;
        return { spanOpenTag, spanCloseTag };
    }

    function spliceLines({
        start,
        text,
        spanOpenTag,
        spanCloseTag,
        linesHTML,
    }) {
        linesHTML = [...linesHTML];
        linesHTML.splice(
            start,
            text.length,
            `${spanOpenTag}${text}${spanCloseTag}`
        );
        return linesHTML.join("");
    }

    function addAnnotationJumpButtons(postSutta) {
        const { annotations } = postSutta.display;
        // console.log(annotations);
        document.querySelector("#annotations").innerHTML =
            annotations
                .map(
                    (_, i) =>
                        `<button class="annotation-jump">${i + 1}</button>`
                )
                .join("") + `<button id="show-all">show all</button>`;
        addHandlers();

        function addHandlers() {
            document.querySelectorAll(".annotation-jump").forEach(
                (button) =>
                    (button.onclick = () => {
                        lines.innerHTML = highlightAnnotation(
                            button.innerText,
                            postSutta
                        );
                        document
                            .querySelector(`#a-${button.innerText}`)
                            .scrollIntoView({ behavior: "smooth" });
                        toggleAnnotationForm(false);
                    })
            );
            document.querySelector("#show-all").onclick = () => {
                toggleAnnotationForm(false);
                lines.innerHTML = highlightAll(postSutta);
                document
                    .querySelector("#a-1")
                    ?.scrollIntoView({ behavior: "smooth" });
            };
        }

        function highlightAll(postSutta) {
            let { linesHTML } = postSutta.display,
                extraStart = 0;
            const { annotations } = postSutta.display,
                sorted = [...annotations].sort((a, b) => a.start - b.start);
            sorted.forEach((anno, i) => {
                let { start } = anno;
                start += extraStart;
                const { text, note } = anno,
                    { spanOpenTag, spanCloseTag } = getTags(
                        annotations.indexOf(anno) + 1,
                        note
                    );
                extraStart += spanOpenTag.length + spanCloseTag.length;
                linesHTML = spliceLines({
                    start,
                    text,
                    spanOpenTag,
                    spanCloseTag,
                    linesHTML,
                });
            });
            return linesHTML;
        }
    }
}

if (window.location.href.includes("/sign-in.html")) {
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
            document.cookie = await makeCookie(userCredential.user);
            window.location.href = "/admin.html";
        } catch (err) {
            alert(err);
        }
        return;
    }
}

// TODO: research more on __session variable
async function makeCookie(user) {
    const token = (await user?.getIdToken()) || "",
        time = token ? 432000 : 0;
    return `__session=${token}; expires=${time}; path=/`;
}
