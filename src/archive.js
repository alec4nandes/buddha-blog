import { getAllPosts } from "./read-write.js";

export default async function loadArchive() {
    const allTitlesAndIds = (await getAllPosts()).map((entry) => ({
            title: entry.post.title,
            id: entry.id,
        })),
        ulElem = document.querySelector("#archive-list");
    ulElem.innerHTML = allTitlesAndIds
        .map(
            ({ title, id }) => `
                <li><a href="/post.html/?id=${id}">${title}</a></li>    
            `
        )
        .join("");
}
