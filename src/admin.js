import {
    addDraft,
    addPost,
    getAllDrafts,
    getDraft,
    getPost,
} from "./read-write.js";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import db, { auth } from "./database.js";
import {
    getSearchParam,
    addAnnotationJumpButtons,
    toggleAnnotationForm,
    highlightAnnotation,
    getSuttaInfoHTML,
} from "./misc.js";

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
                signOutButton = document.querySelector("button#sign-out");
            findSutta.onsubmit = (e) => {
                e.preventDefault();
                const suttaId = e.target.sutta.value;
                loadSutta(suttaId);
            };
            signOutButton.onclick = async () => {
                await signOut(auth);
                window.location.href = "/";
            };
            document.querySelector("#admin-container").style.display = "flex";
        } catch (err) {
            // console.error(err);
            window.location.href = "/sign-in.html";
        }
    });
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

async function loadDraft() {
    const id = getSearchParam("id"),
        draft = id && (await getDraft(id));
    if (draft) {
        const suttaId = id.split(":")[0],
            editPost = document.querySelector("form#edit-post"),
            deleteButton = document.querySelector("button#delete"),
            postStatusDisplay = document.querySelector("span#post-status"),
            hasPost = !!(await getPost(id));
        await loadSutta(suttaId, draft.sutta);
        postStatusDisplay.innerText = hasPost ? "(posted)" : "(draft)";
        Object.entries(draft.post).forEach(
            ([name, value]) => name !== "date" && (editPost[name].value = value)
        );
        deleteButton.disabled = false;
        deleteButton.onclick = async () => {
            const confirmDeletePost = confirm("Delete post?");
            hasPost &&
                confirmDeletePost &&
                (await deleteDoc(doc(db, "posts", id)));
            !hasPost || confirmDeletePost
                ? confirm("Delete draft?") &&
                  (await deleteDoc(doc(db, "drafts", id)))
                : hasPost && alert("To delete draft, delete post first.");
            window.location.href = `?id=${id}`;
        };
    }
}

// many handlers are set here!
async function loadSutta(suttaId, sutta) {
    let postSutta =
            sutta ||
            (await (
                await fetch(`https://fern.haus/sutta/?sutta=${suttaId}`)
            ).json()),
        isValid = !!postSutta.display;

    if (isValid) {
        displayDraftLines(postSutta);

        const clearButton = document.querySelector("#clear-to-annotate"),
            annotateForm = document.querySelector("#annotate"),
            editPost = document.querySelector("#edit-post"),
            enableSubmit = (form) =>
                (form.querySelector("button[type='submit']").disabled = false);

        clearButton.onclick = () => {
            displayDraftLines(postSutta);
            toggleAnnotationForm(true);
        };

        annotateForm.onsubmit = (e) => handleAnnotate(e, postSutta);
        enableSubmit(annotateForm);

        editPost.onsubmit = handleEditPost;
        enableSubmit(editPost);

        // uploads the post to Firestore
        function handleEditPost(e) {
            e.preventDefault();
            const post = Object.fromEntries(new FormData(e.target));
            delete post.type;
            const draft = {
                    post: { ...post, date: new Date() },
                    sutta: postSutta,
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
    } else {
        alert("Sutta does not exist!");
    }

    function displayDraftLines(postSutta) {
        const suttaInfoElem = document.querySelector("#sutta-info"),
            linesElem = document.querySelector("#lines");
        suttaInfoElem.innerHTML = getSuttaInfoHTML(postSutta);
        linesElem.innerHTML = postSutta.display.linesHTML;
        addAnnotationJumpButtons(postSutta);
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
            addAnnotationJumpButtons(postSutta);
            toggleAnnotationForm(false);
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
