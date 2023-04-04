import { updateDraftHelper } from "./pre-bundle.js";

export default async function handleFindSutta(suttaId, postSutta) {
    const hiddenForms = document.querySelector("#hidden-forms"),
        highlight = hiddenForms.querySelector("#highlight"),
        lines = highlight.querySelector("#lines");
    postSutta = postSutta || (await getSutta(suttaId));
    if (!Object.keys(postSutta).length) {
        alert("Invalid sutta!");
        return;
    }
    // for access in other functions
    document.postSutta = postSutta;
    highlight.onsubmit = getSelectionPosition;
    makeJumpButtons(postSutta);
    highlightText(postSutta, lines);
    hiddenForms.style.display = "flex";

    async function getSutta(suttaId) {
        const sutta = await fetch(`https://fern.haus/sutta/?sutta=${suttaId}`);
        return await sutta.json();
    }

    function handleAnnotate(e, postSutta) {
        e.preventDefault();
        const note = e.target.note.value,
            annotation = getAnnotation(postSutta, note);
        if (annotation) {
            postSutta.display.annotations =
                postSutta.display.annotations.filter(
                    (oldAnno) => !isOverlapped(oldAnno, annotation)
                );
            postSutta.display.annotations.push(annotation);
            highlightText(postSutta, lines);
            updateDraftHelper();
        }

        function getAnnotation(postSutta, note) {
            note = note.trim();
            const { linesHTML } = postSutta.display,
                text = getHighlighted();
            return (
                text &&
                note && {
                    text,
                    // TODO/warning: might not always be the first occurrence
                    start: linesHTML.indexOf(text),
                    note,
                }
            );

            /*
                returns string
            */
            function getHighlighted() {
                const selected =
                    window.getSelection?.() ||
                    document.getSelection?.() ||
                    document.selection?.createRange().text;
                getSelectionPosition();
                return selected?.toString().trim().replaceAll("\n", "<br/>");
                // .replaceAll("\r", "");
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

    function getSelectionPosition(e) {
        e.preventDefault();
        const selection = window.getSelection(),
            children = [...document.querySelector("#lines").childNodes],
            lastNode = children.findLast((node) =>
                selection.containsNode(node)
            );
        console.clear();
        console.log(lastNode);
    }

    function makeJumpButtons(postSutta) {
        document.querySelector("#annotations").innerHTML =
            "<u>annotations</u>: " +
            (postSutta.display.annotations.length
                ? postSutta.display.annotations
                      .map(
                          (_, i) =>
                              `<button class="annotation-jump">${
                                  i + 1
                              }</button>`
                      )
                      .join("")
                : "n/a");
        document.querySelectorAll(".annotation-jump").forEach(
            (button) =>
                (button.onclick = () => {
                    clearAllHighlights();
                    const span = document.querySelector(
                        `#a-${button.innerText}`
                    );
                    span.classList.add("annotation-picked");
                    span.scrollIntoView({ behavior: "smooth" });
                })
        );
    }

    function highlightText(postSutta, lines) {
        const { annotations } = postSutta.display;
        let { linesHTML } = postSutta.display;
        let extraStart = 0;
        annotations.sort((a, b) => a.start - b.start);
        annotations.forEach(({ text, start, note }, i) => {
            start += extraStart;
            const spanOpenTag = `<span id="a-${i + 1}" class="highlighted">`,
                spanCloseTag = `
                    <small class="note-display">${note}</small>
                </span>
            `;
            extraStart += spanOpenTag.length + spanCloseTag.length;
            linesHTML = [...linesHTML];
            linesHTML.splice(
                start,
                text.length,
                `${spanOpenTag}${text}${spanCloseTag}`
            );
            linesHTML = linesHTML.join("");
        });
        lines.innerHTML = linesHTML;
        const allSpans = document.querySelectorAll(".highlighted");
        allSpans.forEach((s) => (s.onmouseover = clearAllHighlights));
    }
}

function clearAllHighlights() {
    const allSpans = document.querySelectorAll(".highlighted");
    allSpans.forEach((s) => s.classList.remove("annotation-picked"));
}
