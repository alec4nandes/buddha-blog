setToggleHandlers();

function setToggleHandlers() {
    const [expandSuttaButton, expandPostButton, showBothButton] = getButtons();
    expandSuttaButton.onclick = handleExpandSutta;
    expandPostButton.onclick = handleExpandPost;
    showBothButton.onclick = handleShowBoth;

    function getButtons() {
        const expandSuttaButton = document.querySelector("button#expand-sutta"),
            expandPostButton = document.querySelector("button#expand-post"),
            showBothButton = document.querySelector("button#show-both");
        return [expandSuttaButton, expandPostButton, showBothButton];
    }

    function handleExpandSutta(e) {
        expandHelper(e, "sutta");
    }

    function handleExpandPost(e) {
        expandHelper(e, "post");
    }

    function expandHelper(e, side) {
        disableButton(e);
        const { suttaElem, postElem } = getElems(),
            isSutta = side === "sutta",
            elem = isSutta ? suttaElem : postElem,
            otherElem = isSutta ? postElem : suttaElem;
        elem.classList.remove("hide");
        otherElem.classList.remove("wide");
        elem.classList.add("wide");
        otherElem.classList.add("hide");
    }

    function handleShowBoth(e) {
        disableButton(e);
        const { suttaElem, postElem } = getElems();
        [suttaElem, postElem].forEach((elem) =>
            elem.classList.remove("hide", "wide")
        );
    }

    function disableButton(e) {
        getButtons().forEach((button) => (button.disabled = false));
        e.target.disabled = true;
    }

    function getElems() {
        const suttaElem = document.querySelector("#sutta-container"),
            postElem = document.querySelector("#post");
        return { suttaElem, postElem };
    }
}
