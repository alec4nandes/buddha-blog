import { parseDate } from "./misc.js";
import { getAllPosts } from "./read-write.js";

export default async function loadArchive() {
    const data = (await getAllPosts()).map((entry) => ({
            date: entry.post.date,
            id: entry.id,
            title: entry.post.title,
        })),
        ulElem = document.querySelector("#archive-list");
    ulElem.innerHTML = data.map(getArchiveListItemHTML).join("");

    function getArchiveListItemHTML({ date, id, title }) {
        return `
            <li>
                ${parseDate(date)}:
                <a href="/post.html?id=${id}">${title}</a>
            </li>`;
    }
}
