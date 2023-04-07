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
} else if (window.location.href.includes("/post.html")) {
    /*** POST.HTML - SINGLE POST ***/
    loadPost();
} else if (window.location.href.includes("/archive.html")) {
    /*** ARCHIVE.HTML - LIST ALL POSTS ***/
    loadArchive();
} else if (window.location.href.includes("/search.html")) {
    /*** SEARCH.HTML - FIND CONTENT ***/
    loadSearch();
} else if (window.location.href.includes("/tags.html")) {
    /*** TAGS.HTML - FIND RELATED CONTENT ***/
    loadTags();
} else if (window.location.href.includes("/admin.html")) {
    /*** ADMIN.HTML - EDIT POSTS ***/
    loadAdmin();
} else if (window.location.href.includes("/sign-in.html")) {
    /*** SIGN-IN.HTML - ACCESS DRAFTS ***/
    loadSignIn();
} else {
    window.location.href = "/404.html";
}
