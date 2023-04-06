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

export { getSearchParam, getHTMLData };
