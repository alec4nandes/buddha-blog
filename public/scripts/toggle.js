setToggleHandlers();

function setToggleHandlers() {
    const { expandSuttaButton, expandPostButton, showBothButton } =
        getButtons();
    expandSuttaButton.onclick = handleExpandSutta;
    expandPostButton.onclick = handleExpandPost;
    showBothButton.onclick = handleShowBoth;

    function disableButton(e) {
        Object.values(getButtons()).forEach(
            (button) => (button.disabled = false)
        );
        e.target.disabled = true;
    }

    function getButtons() {
        const expandSuttaButton = document.querySelector("button#expand-sutta"),
            expandPostButton = document.querySelector("button#expand-post"),
            showBothButton = document.querySelector("button#show-both");
        return { expandSuttaButton, expandPostButton, showBothButton };
    }

    function getElems() {
        const suttaElem = document.querySelector("#sutta-container"),
            postElem = document.querySelector("#post");
        return { suttaElem, postElem };
    }

    function handleExpandHelper(e, side) {
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

    function handleExpandPost(e) {
        handleExpandHelper(e, "post");
    }

    function handleExpandSutta(e) {
        handleExpandHelper(e, "sutta");
    }

    function handleShowBoth(e) {
        disableButton(e);
        const { suttaElem, postElem } = getElems();
        [suttaElem, postElem].forEach((elem) =>
            elem.classList.remove("hide", "wide")
        );
    }
}
