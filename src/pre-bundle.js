import loadPosts from "./posts.js";
import loadPost from "./post.js";
import loadArchive from "./archive.js";
import loadSearch from "./search.js";
import loadTags from "./tags.js";
import loadAdmin from "./admin.js";
import loadSignIn from "./sign-in.js";

/*** INDEX.HTML - SHOW POSTS ***/
if (location.pathname == "/") {
    loadPosts();
}

/*** POST.HTML - SINGLE POST ***/
if (window.location.href.includes("/post.html")) {
    loadPost();
}

/*** ARCHIVE.HTML - LIST ALL POSTS ***/
if (window.location.href.includes("/archive.html")) {
    loadArchive();
}

/*** SEARCH.HTML - FIND CONTENT ***/
if (window.location.href.includes("/search.html")) {
    loadSearch();
}

/*** TAGS.HTML - FIND RELATED CONTENT ***/
if (window.location.href.includes("/tags.html")) {
    loadTags();
}

/*** ADMIN.HTML - EDIT POSTS ***/
if (window.location.href.includes("/admin.html")) {
    loadAdmin();
}

/*** SIGN-IN.HTML - ACCESS DRAFTS ***/
if (window.location.href.includes("/sign-in.html")) {
    loadSignIn();
}
