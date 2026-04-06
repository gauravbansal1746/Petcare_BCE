/**
 * Include on dashboard/settings pages. Sends guests to home if there is no JWT.
 */
(function () {
    if (!localStorage.getItem("token")) {
        console.warn("[petcare] no token — redirect to login");
        window.location.replace("/");
    }
})();
