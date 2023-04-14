function getNoteTags(index, note) {
    const spanOpenTag = `<span id="a-${index}" class="highlighted">`,
        noteTag = note && `<small class="note-display"> ${note}</small>`,
        spanCloseTag = `${noteTag || ""}</span>`;
    return { spanOpenTag, spanCloseTag };
}

function getPostData(entry) {
    const { post, sutta } = entry,
        { date, image_url, image_caption, content } = post,
        date_string = parseDate(date),
        image_html = getImageHTML(image_url, image_caption);
    let { sutta_title, section_pali, chapter_number } = sutta;
    sutta_title = sutta_title.trim();
    const sutta_summary = `${sutta_title} ${
            sutta_title ? "(" : ""
        }${section_pali}${chapter_number ? " " + chapter_number : ""}${
            sutta_title ? ")" : ""
        }`,
        content_preview =
            content.slice(0, 500) + (content.length > 500 ? "..." : "");
    return {
        date_string,
        image_html,
        sutta_summary,
        content_preview,
    };

    function parseDate(date) {
        const { seconds } = date,
            ms = seconds * 1000,
            d = new Date(ms),
            localeString = d.toLocaleDateString("en-us", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
            }),
            pad = (num) => ("" + num).padStart(2, "0"),
            hours = pad(d.getHours()),
            minutes = pad(d.getMinutes());
        return `${localeString} at ${hours}:${minutes}`;
    }

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
}

function getSearchParam(param) {
    const params = new URL(document.location).searchParams;
    return params.get(param);
}

function highlightAll(sutta) {
    const { annotations } = sutta.display;
    let { linesHTML } = sutta.display,
        extraStart = 0;
    annotations.forEach((anno) => {
        let { start } = anno;
        start += extraStart;
        const { text, note } = anno,
            { spanOpenTag, spanCloseTag } = getNoteTags(
                annotations.indexOf(anno),
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

function loadSearchAndTagsHelper({ param, posts, displayElem, resultsElem }) {
    displayElem.innerText = param;
    resultsElem.innerHTML =
        (posts.length
            ? posts.map(getPostPreviewHTML).join("<hr/>")
            : `<p id="nothing-found">No results found!</p>`) +
        (posts.length ? "<hr/>" : "");

    function getPostPreviewHTML(post) {
        const {
                title,
                subtitle,
                date_string,
                image_html,
                content_preview,
                tags_html,
                id,
                sutta_summary,
            } = getHTMLData(post),
            openLinkTag = `<a href="/posts/${id}.html">`;
        return `
                <div>
                    <h2>${openLinkTag}${title}</a></h2>
                    ${subtitle ? `<h3 class="subtitle">${subtitle}</h3>` : ""}
                    <small class="date">${date_string}</small>
                    <p>
                        <strong>
                            <small>
                                Featured sutta: ${sutta_summary}
                            </small>
                        </strong>
                    </p>
                    ${image_html}
                    ${content_preview}
                    <p>${openLinkTag}read alongside sutta</a></p>
                    ${tags_html}
                </div>
            `;

        function getHTMLData(entry) {
            const { post, id } = entry,
                { title, subtitle, content, tags } = post,
                tags_html = getTagsHTML(tags);
            return {
                title,
                subtitle,
                content,
                tags_html,
                id,
                ...getPostData(entry),
            };

            function getTagsHTML(tags) {
                return tags.length
                    ? `
                        <p>tags: ${tags
                            .map(
                                (tag) =>
                                    `<a href="/tags/index.html?tag=${tag}">${tag}</a>`
                            )
                            .join(", ")}</p>
                    `
                    : "";
            }
        }
    }
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

module.exports = {
    getNoteTags,
    getPostData,
    getSearchParam,
    highlightAll,
    loadSearchAndTagsHelper,
    spliceLines,
};
