const noteButtons =
    document.querySelector("#annotations")?.querySelectorAll("button") || [];
noteButtons.forEach(handleShowNote);

function handleShowNote(button, i) {
    const linesElem = document.querySelector("#lines"),
        allHighlights = linesElem.querySelectorAll(".highlighted"),
        noteElem = linesElem.querySelector(`#a-${i}`),
        removeExpand = (elem) => elem.classList.remove("expand");
    button.onclick = () => {
        allHighlights.forEach(removeExpand);
        noteElem.classList.add("expand");
        noteElem.scrollIntoView({ behavior: "smooth" });
    };
}
