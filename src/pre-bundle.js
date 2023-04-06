import loadPosts from "./posts.js";
import loadPost from "./post.js";
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

/*** ADMIN.HTML - EDIT POSTS ***/
if (window.location.href.includes("/admin.html")) {
    loadAdmin();
}

/*** SIGN-IN.HTML - ACCESS DRAFTS ***/
if (window.location.href.includes("/sign-in.html")) {
    loadSignIn();
}
