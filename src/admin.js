const { getRandomSuttaId } = require("./crawled.js");
const { auth } = require("./database.js");
const { getAuth, onAuthStateChanged, signOut } = require("firebase/auth");
const {
    getNoteTags,
    getSearchParam,
    highlightAll,
    spliceLines,
} = require("./misc.js");
const {
    addDraft,
    addPost,
    deleteDraft,
    deletePost,
    getAllDrafts,
    getDraft,
    getPost,
} = require("./read-write.js");

function addAnnotationJumpButtons(sutta, isPublished) {
    const { annotations } = sutta.display;
    if (annotations.length) {
        const annoElem = document.querySelector("#annotations"),
            getButtonHTML = (i) =>
                `<button class="annotation-jump">${i + 1}</button>`,
            showAllButton =
                !isPublished &&
                annotations.length > 1 &&
                `<button id="show-all">show all</button>`,
            deleteAnnotationForm = document.querySelector("#delete-annotation");
        annoElem.innerHTML =
            annotations.map((_, i) => getButtonHTML(i)).join("") +
            (showAllButton || "");
        if (deleteAnnotationForm) {
            const select = deleteAnnotationForm.querySelector("select"),
                getOptionHTML = (i) =>
                    `<option value="${i + 1}">${i + 1}</option>`;
            select.innerHTML = annotations
                .map((_, i) => getOptionHTML(i))
                .join("");
            deleteAnnotationForm.onsubmit = (e) =>
                handleDeleteAnnotation(e, annotations, sutta, isPublished);
        }
    }
    const container = document.querySelector("#notes-container");
    container.style.display = annotations.length ? "flex" : "none";
    addHandlers(sutta, isPublished);

    function handleDeleteAnnotation(e, annotations, sutta, isPublished) {
        e.preventDefault();
        const buttonText = e.target.index.value,
            index = buttonText - 1,
            goAhead = confirm(`Delete note #${buttonText}?`);
        if (goAhead) {
            annotations.splice(index, 1);
            document.querySelector("#lines").innerHTML =
                sutta.display.linesHTML;
            addAnnotationJumpButtons(sutta, isPublished);
        }
    }

    function addHandlers(sutta, isPublished) {
        const jumpButtons = document.querySelectorAll(".annotation-jump"),
            showAllButton = document.querySelector("#show-all"),
            linesElem = document.querySelector("#lines");
        jumpButtons.forEach(
            (b) =>
                (b.onclick = (e) =>
                    handleAnnotationJump(e, isPublished, linesElem, sutta))
        );
        showAllButton &&
            (showAllButton.onclick = () => handleShowAll(linesElem, sutta));

        function handleAnnotationJump(e, isPublished, linesElem, sutta) {
            const index = +e.target.innerText;
            if (!isPublished) {
                toggleAnnotationForm(false);
                linesElem.innerHTML = highlightAnnotation(index, sutta);
            }
            const elems = document.querySelectorAll(".highlighted"),
                highlights = [...elems],
                getHighlight = (index) => document.querySelector(`#a-${index}`);
            highlights.forEach((span) => span.classList.remove("expand"));
            getHighlight(index).classList.add("expand");
            getHighlight(index).scrollIntoView({ behavior: "smooth" });
        }

        function handleShowAll(linesElem, sutta) {
            toggleAnnotationForm(false);
            linesElem.innerHTML = highlightAll(sutta);
            document
                // scroll to first annotation:
                .querySelector("#a-0")
                ?.scrollIntoView({ behavior: "smooth" });
        }
    }
}

function displaySuttaNav(sutta) {
    const displayElem = document.querySelector("#sutta-nav"),
        { sutta_id, prev_id, next_id } = sutta || {};
    displayElem.innerHTML = `
        ${prev_id ? `<button id="prev-sutta"><</button>` : ""}
        ${sutta_id || ""}
        ${next_id ? `<button id="next-sutta">></button>` : ""}
        <button id="random">random</button>`;
    const prevButton = displayElem.querySelector("#prev-sutta"),
        nextButton = displayElem.querySelector("#next-sutta"),
        randomButton = displayElem.querySelector("#random");
    prevButton && (prevButton.onclick = () => loadSutta(prev_id));
    nextButton && (nextButton.onclick = () => loadSutta(next_id));
    randomButton.onclick = () => loadSutta(getRandomSuttaId());
}

function getAnnotation() {
    const selection = window.getSelection(),
        selectionString = selection.toString().trimEnd(),
        // no spaces or line breaks as annotations:
        hasSelection = !!selectionString.trim();
    if (hasSelection) {
        const children = [...document.querySelector("#lines").childNodes],
            { anchorNode, anchorOffset, focusNode, focusOffset } = selection,
            anchorIndex = children.indexOf(anchorNode),
            focusIndex = children.indexOf(focusNode),
            hasFocus = focusIndex !== -1,
            isBackwards =
                hasFocus &&
                (focusIndex < anchorIndex ||
                    (focusIndex === anchorIndex && focusOffset < anchorOffset)),
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
        };
    }
}

function handleAnnotate(e, sutta) {
    e.preventDefault();
    const linesElem = document.querySelector("#lines"),
        data = linesElem.getAttribute("data-annotation");
    if (data) {
        const note = document
                .querySelector("textarea[name='note']")
                .value.trim(),
            annotation = { ...JSON.parse(data), note };
        sutta.display.annotations = sutta.display.annotations.filter(
            (oldAnno) => !isOverlapped(oldAnno, annotation)
        );
        const { annotations } = sutta.display;
        annotations.push(annotation);
        annotations.sort((a, b) => a.start - b.start);
        const index = annotations.indexOf(annotation) + 1;
        linesElem.innerHTML = highlightAnnotation(index, sutta);
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
}

function highlightAnnotation(index, sutta) {
    const { annotations } = sutta.display,
        { start, text, note } = annotations[index - 1],
        { spanOpenTag, spanCloseTag } = getNoteTags(index, note);
    return spliceLines({
        start,
        text,
        spanOpenTag,
        spanCloseTag,
        linesHTML: sutta.display.linesHTML,
    });
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

function loadAdmin() {
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
            window.location.href = "/sign-in";
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

async function loadDraft() {
    const id = getSearchParam("id"),
        draft = id && (await getDraft(id));
    displaySuttaNav();
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
        sutta =
            sut || (await getJson(`https://fern.haus/sutta?sutta=${suttaId}`)),
        isValid = !!sutta.display;
    displaySuttaNav(sutta);
    if (isValid) {
        displaySutta(sutta);
        const clearButton = document.querySelector("#clear-to-annotate"),
            annotateForm = document.querySelector("#annotate"),
            editPost = document.querySelector("#edit-post"),
            linesElem = document.querySelector("#lines"),
            enableSubmit = (form) =>
                (form.querySelector("button[type='submit']").disabled = false),
            setSelection = () =>
                linesElem.setAttribute(
                    "data-annotation",
                    JSON.stringify(getAnnotation())
                );
        annotateForm.onsubmit = (e) => handleAnnotate(e, sutta);
        clearButton.onclick = () => handleClearHighlights(sutta);
        editPost.onsubmit = (e) => handleUpload(e, sutta);
        enableSubmit(annotateForm);
        enableSubmit(editPost);
        linesElem.onmouseup = setSelection;
        linesElem.ontouchend = setSelection;
    } else {
        alert("Sutta does not exist!");
    }

    function displaySutta(sutta) {
        const suttaInfoElem = document.querySelector("#sutta-info"),
            linesElem = document.querySelector("#lines");
        suttaInfoElem.innerHTML = getSuttaInfoHTML(sutta);
        linesElem.innerHTML = sutta.display.linesHTML;
        addAnnotationJumpButtons(sutta);

        function getSuttaInfoHTML(sutta) {
            const {
                sutta_title,
                section_pali,
                chapter_number,
                chapter_title,
                chapter_description,
                sutta_description,
                section_title,
                section_description,
            } = sutta;
            return `
                <div id="sutta-info">
                    <details id="sutta-chapter-info">
                        <summary>
                            ${[...new Set([section_pali, section_title])].join(
                                ": "
                            )}
                        </summary>
                        <p>${section_description}</p>
                        ${
                            chapter_title && chapter_description
                                ? `
                                    <p><u>${chapter_title.trim()}</u>:</p>
                                    <p>${chapter_description}</p>
                                `
                                : ""
                        }
                    </details>
                    ${
                        sutta_title
                            ? `<h2 id="sutta-title">${sutta_title}</h2> —`
                            : ""
                    }
                    <small id="sutta-pali-name">
                        ${section_pali}
                        ${chapter_number ? " " + chapter_number : ""}
                    </small>
                    ${
                        sutta_description
                            ? `
                                <details>
                                    <summary>Summary</summary>
                                    <p>${sutta_description}</p>
                                </details>
                            `
                            : ""
                    }
                </div>
            `;
        }
    }

    function handleClearHighlights(sutta) {
        displaySutta(sutta);
        toggleAnnotationForm(true);
    }

    // uploads the post to Firestore
    function handleUpload(e, sutta) {
        e.preventDefault();
        const post = Object.fromEntries(new FormData(e.target));
        delete post.type;
        post.tags = post.tags
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean);
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
}

function toggleAnnotationForm(enabled) {
    const clearButton = document.querySelector("#clear-to-annotate"),
        annotateButton = document
            .querySelector("#annotate")
            ?.querySelector("button[type='submit']");
    clearButton && (clearButton.disabled = enabled);
    annotateButton && (annotateButton.disabled = !enabled);
}

module.exports = { loadAdmin };
