function display(postSutta) {
    const linesElem = document.querySelector("#lines");
    linesElem.innerHTML = postSutta.display.linesHTML;
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
    postSutta.display.annotations = postSutta.display.annotations.filter(
        (oldAnno) => !isOverlapped(oldAnno, annotation)
    );
    const { annotations } = postSutta.display;
    annotations.push(annotation);
    lines.innerHTML = highlightAnnotation(annotations.length, postSutta);
    toggleAnnotationForm(false);
    addAnnotationJumpButtons(annotations, postSutta);
}

function getAnnotation(note, postSutta) {
    note = note.trim();
    const selection = window.getSelection(),
        children = [...document.querySelector("#lines").childNodes],
        lastIndex = children.findIndex((node) => selection.containsNode(node)),
        upTo = children
            .slice(0, lastIndex)
            .map((node) => node.textContent)
            .filter(Boolean)
            .join("<br/>"),
        text = selection.toString().trim(),
        start =
            postSutta.display.linesHTML.slice(upTo.length).indexOf(text) +
            upTo.length;
    console.log(upTo);
    return (
        text && {
            text,
            start,
            note,
        }
    );
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
        noteTag = note && ` <small class="note-display">${note}</small>`,
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

function addAnnotationJumpButtons(annotations, postSutta) {
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
                    toggleAnnotationForm(false);
                })
        );
        document.querySelector("#show-all").onclick = () => {
            lines.innerHTML = highlightAll(postSutta);
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

export { display, toggleAnnotationForm, handleAnnotate };
