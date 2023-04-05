import { addDraft, getAllDrafts, getDraft } from "./read-write.js";

loadDraft();
listDrafts();

const findSutta = document.querySelector("#find-sutta");
findSutta.onsubmit = (e) => {
    e.preventDefault();
    const suttaId = e.target.sutta.value;
    loadSutta(suttaId);
};

async function loadDraft() {
    const params = new URL(document.location).searchParams,
        id = params.get("id"),
        draft = id && (await getDraft(id)),
        suttaId = id?.split(":")[0];
    if (draft) {
        await loadSutta(suttaId, draft.sutta);
        const editPost = document.querySelector("#edit-post");
        Object.entries(draft.post).forEach(
            ([name, value]) => (editPost[name].defaultValue = value)
        );
    }
}

async function listDrafts() {
    const draftIds = await getAllDrafts();
    document.querySelector("footer").innerHTML =
        "DRAFTS: " +
        (draftIds.length
            ? draftIds.map((id) => `<a href="./?id=${id}">${id}</a>`).join(", ")
            : "n/a");
}

async function loadSutta(suttaId, sutta) {
    let postSutta =
        sutta ||
        (await (
            await fetch(`https://fern.haus/sutta/?sutta=${suttaId}`)
        ).json());

    display(postSutta);

    document.querySelector("#add-annotation").onclick = () => {
        display(postSutta);
        toggleAnnotationForm(true);
    };

    document.querySelector("#annotate").onsubmit = (e) =>
        handleAnnotate(e, postSutta);

    document.querySelector("#edit-post").onsubmit = async (e) => {
        e.preventDefault();
        const post = Object.fromEntries(new FormData(e.target)),
            draft = { post, sutta: postSutta },
            id = await addDraft(draft);
        alert("Draft updated!");
        window.location.href = `/?id=${id}`;
    };
}

function display(postSutta) {
    const linesElem = document.querySelector("#lines");
    linesElem.innerHTML = postSutta.display.linesHTML;
    addAnnotationJumpButtons(postSutta);
}

function toggleAnnotationForm(enabled) {
    document.querySelector("#add-annotation").disabled = enabled;
    document
        .querySelector("#annotate")
        .querySelector("button[type='submit']").disabled = !enabled;
}

function handleAnnotate(e, postSutta) {
    e.preventDefault();
    const lines = document.querySelector("#lines"),
        annotation = getAnnotation(e.target.note.value, postSutta);
    if (annotation) {
        postSutta.display.annotations = postSutta.display.annotations.filter(
            (oldAnno) => !isOverlapped(oldAnno, annotation)
        );
        const { annotations } = postSutta.display;
        annotations.push(annotation);
        lines.innerHTML = highlightAnnotation(annotations.length, postSutta);
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
        noteTag = note && ` <small class="note-display">${note}</small>&nbsp;`,
        spanCloseTag = `${noteTag || ""}</span>`;
    return { spanOpenTag, spanCloseTag };
}

function spliceLines({ start, text, spanOpenTag, spanCloseTag, linesHTML }) {
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
            .map((_, i) => `<button class="annotation-jump">${i + 1}</button>`)
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

export { loadSutta };
