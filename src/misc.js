function getSearchParam(param) {
    const params = new URL(document.location).searchParams;
    return params.get(param);
}

function getHTMLData(aPost) {
    const { post, sutta, id } = aPost,
        { title, subtitle, date, image_url, image_caption, content, tags } =
            post,
        d = new Date(date.seconds * 1000),
        dateString =
            d.toLocaleDateString("en-us", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
            }) + ` at ${d.getHours()}:${d.getMinutes()}`,
        tagsHTML = getTagsHTML(tags),
        imageHTML = getImageHTML(image_url, image_caption);
    return {
        title,
        subtitle,
        dateString,
        imageHTML,
        content,
        tagsHTML,
        id,
    };

    function getImageHTML(imageUrl, imageCaption) {
        return imageUrl
            ? `
                <figure>
                    <img src="${imageUrl}" />
                    ${
                        image_caption
                            ? `<figcaption>${imageCaption}</figcaption>`
                            : ""
                    }
                </figure>
            `
            : "";
    }

    function getTagsHTML(tags) {
        return `
            <p>tags: ${tags
                .split(",")
                .map((tag) => tag.trim())
                .map((tag) => `<a href="/tags.html/?tag=${tag}">${tag}</a>`)
                .join(", ")}</p>
        `;
    }
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
            { spanOpenTag, spanCloseTag } = getNoteTags(
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

function getNoteTags(index, note) {
    const spanOpenTag = `<span id="a-${index}" class="highlighted">`,
        noteTag = note && `<small class="note-display"> ${note}</small>&nbsp;`,
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

function addAnnotationJumpButtons(postSutta, isPublished) {
    const { annotations } = postSutta.display;
    // console.log(annotations);
    document.querySelector("#annotations").innerHTML =
        annotations
            .map((_, i) => `<button class="annotation-jump">${i + 1}</button>`)
            .join("") +
        (!isPublished && annotations.length > 1
            ? `<button id="show-all">show all</button>`
            : "");
    addHandlers();

    function addHandlers() {
        const jumpButtons = document.querySelectorAll(".annotation-jump"),
            showAllButton = document.querySelector("#show-all");
        jumpButtons.forEach((b) => (b.onclick = handleAnnotationJump));
        showAllButton && (showAllButton.onclick = handleShowAll);

        function handleAnnotationJump(e) {
            const buttonText = e.target.innerText,
                getHighlight = () => document.querySelector(`#a-${buttonText}`);
            if (isPublished) {
                const allHighlights = [
                    ...document.querySelectorAll(".highlighted"),
                ];
                allHighlights.forEach((span) =>
                    span.classList.remove("expand")
                );
                getHighlight().classList.add("expand");
            } else {
                toggleAnnotationForm(false);
                lines.innerHTML = highlightAnnotation(buttonText, postSutta);
            }
            getHighlight().scrollIntoView({ behavior: "smooth" });
        }

        function handleShowAll() {
            toggleAnnotationForm(false);
            lines.innerHTML = highlightAll(postSutta);
            document
                // scroll to first annotation:
                .querySelector("#a-1")
                ?.scrollIntoView({ behavior: "smooth" });
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

function highlightAnnotation(number, postSutta) {
    const { annotations } = postSutta.display,
        { start, text, note } = annotations[number - 1],
        { spanOpenTag, spanCloseTag } = getNoteTags(number, note);
    return spliceLines({
        start,
        text,
        spanOpenTag,
        spanCloseTag,
        linesHTML: postSutta.display.linesHTML,
    });
}

export {
    getSearchParam,
    getHTMLData,
    highlightAll,
    addAnnotationJumpButtons,
    toggleAnnotationForm,
    highlightAnnotation,
};
