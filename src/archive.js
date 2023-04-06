import { getAllPosts } from "./read-write.js";
import { parseDate } from "./misc.js";

export default async function loadArchive() {
    const allTitlesAndIds = (await getAllPosts()).map((entry) => ({
            date: entry.post.date,
            id: entry.id,
            title: entry.post.title,
        })),
        ulElem = document.querySelector("#archive-list");
    ulElem.innerHTML = allTitlesAndIds
        .map(
            ({ date, id, title }) => `
                <li>${parseDate(
                    date
                )}: <a href="/post.html/?id=${id}">${title}</a></li>    
            `
        )
        .join("");
}
