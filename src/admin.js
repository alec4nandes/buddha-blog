import { auth } from "./database.js";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
    addAnnotationJumpButtons,
    getSearchParam,
    getSuttaInfoHTML,
    highlightAnnotation,
    toggleAnnotationForm,
} from "./misc.js";
import {
    addDraft,
    addPost,
    deleteDraft,
    deletePost,
    getAllDrafts,
    getDraft,
    getPost,
} from "./read-write.js";

export default function loadAdmin() {
    onAuthStateChanged(getAuth(), async (user) => {
        try {
            // With the correctly set Firestore permissions,
            // listDrafts will throw an access error when admin
            // is not logged in. Catch this error and redirect
            // to sign-in.html
            await listDrafts();
            await loadDraft();
            const findSutta = document.querySelector("#find-sutta"),
                signOutButton = document.querySelector("button#sign-out"),
                container = document.querySelector("#admin-container");
            findSutta.onsubmit = handleFindSutta;
            signOutButton.onclick = handleSignOut;
            container.style.display = "flex";
        } catch (err) {
            // console.error(err);
            window.location.href = "/sign-in.html";
        }
    });

    function handleFindSutta(e) {
        e.preventDefault();
        const suttaId = e.target.sutta.value;
        loadSutta(suttaId);
    }

    async function handleSignOut() {
        await signOut(auth);
        window.location.href = "/";
    }
}

async function listDrafts() {
    const draftIds = (await getAllDrafts()).map((draft) => draft.id),
        footer = document.querySelector("footer");
    footer.innerHTML =
        "DRAFTS: " +
        (draftIds.length
            ? draftIds.map((id) => `<a href="?id=${id}">${id}</a>`).join(", ")
            : "n/a");
}

async function loadDraft() {
    const id = getSearchParam("id"),
        draft = id && (await getDraft(id));
    if (draft) {
        const { sutta, post } = draft,
            suttaId = id.split(":")[0],
            editPost = document.querySelector("form#edit-post"),
            deleteButton = document.querySelector("button#delete"),
            postStatusDisplay = document.querySelector("span#post-status"),
            hasPost = !!(await getPost(id));
        await loadSutta(suttaId, sutta);
        Object.entries(post).forEach(
            ([name, value]) => name !== "date" && (editPost[name].value = value)
        );
        deleteButton.disabled = false;
        deleteButton.onclick = () => handleDeletePost(hasPost, id);
        postStatusDisplay.innerText = hasPost ? "(posted)" : "(draft)";
    }

    async function handleDeletePost(hasPost, id) {
        const confirmDeletePost = confirm("Delete post?");
        hasPost && confirmDeletePost && (await deletePost(id));
        !hasPost || confirmDeletePost
            ? confirm("Delete draft?") && (await deleteDraft(id))
            : hasPost && alert("To delete draft, delete post first.");
        window.location.href = `?id=${id}`;
    }
}

async function loadSutta(suttaId, sut) {
    const getJson = async (url) => await (await fetch(url)).json(),
        sutta = sut || getJson(`https://fern.haus/sutta/?sutta=${suttaId}`),
        isValid = !!sutta.display;
    if (isValid) {
        displayDraftLines(sutta);
        const clearButton = document.querySelector("#clear-to-annotate"),
            annotateForm = document.querySelector("#annotate"),
            editPost = document.querySelector("#edit-post"),
            enableSubmit = (form) =>
                (form.querySelector("button[type='submit']").disabled = false);
        clearButton.onclick = () => handleClearHighlights(sutta);
        editPost.onsubmit = (e) => handleEditPost(e, sutta);
        annotateForm.onsubmit = (e) => handleAnnotate(e, sutta);
        enableSubmit(annotateForm);
        enableSubmit(editPost);
    } else {
        alert("Sutta does not exist!");
    }

    function displayDraftLines(sutta) {
        const suttaInfoElem = document.querySelector("#sutta-info"),
            linesElem = document.querySelector("#lines");
        suttaInfoElem.innerHTML = getSuttaInfoHTML(sutta);
        linesElem.innerHTML = sutta.display.linesHTML;
        addAnnotationJumpButtons(sutta);
    }

    function handleClearHighlights(sutta) {
        displayDraftLines(sutta);
        toggleAnnotationForm(true);
    }

    // uploads the post to Firestore
    function handleEditPost(e, sutta) {
        e.preventDefault();
        const post = Object.fromEntries(new FormData(e.target));
        delete post.type;
        const draft = {
                post: { ...post, date: new Date() },
                sutta,
            },
            type = e.target.type.value;
        upload(draft, type);

        async function upload(draft, type) {
            try {
                // upload draft regardless:
                const id = await addDraft(draft);
                if (id) {
                    const isPost = type === "post";
                    isPost && (await addPost(draft));
                    alert(`${type} uploaded!`);
                    window.location.href = `?id=${id}`;
                }
            } catch (err) {
                alert(err);
            }
        }
    }

    function handleAnnotate(e, sutta) {
        e.preventDefault();
        const lines = document.querySelector("#lines"),
            annotation = getAnnotation(e.target.note.value);
        if (annotation) {
            sutta.display.annotations = sutta.display.annotations.filter(
                (oldAnno) => !isOverlapped(oldAnno, annotation)
            );
            const { annotations } = sutta.display;
            annotations.push(annotation);
            annotations.sort((a, b) => a.start - b.start);
            const index = annotations.indexOf(annotation);
            lines.innerHTML = highlightAnnotation(index, sutta);
            addAnnotationJumpButtons(sutta);
            toggleAnnotationForm(false);
        }

        /*
            Returns annotation data for the displayed sutta if
            there's a valid selection, returns undefined otherwise.
            This method uses the DOM, so the browser's displayed
            sutta HTML in div#lines needs to match the HTML in
            sutta.display.linesHTML
        */
        function getAnnotation(note) {
            const selection = window.getSelection(),
                selectionString = selection.toString().trimEnd(),
                // no spaces or line breaks as annotations:
                hasSelection = !!selectionString.trim();
            if (hasSelection) {
                const children = [
                        ...document.querySelector("#lines").childNodes,
                    ],
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
                        children.findIndex((node) =>
                            selection.containsNode(node)
                        ) + extraIndexes,
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
                (oldStart <= newStart &&
                    newStart <= oldStart + oldText.length) ||
                (newStart <= oldStart &&
                    oldStart + oldText.length <= newStart + newText.length)
            );
        }
    }
}
