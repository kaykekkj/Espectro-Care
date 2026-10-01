(function () {
    if (!window.EspectroCareAuth) return;

    const root = document.documentElement;
    root.style.visibility = "hidden";

    const guard = window.EspectroCareAuth.requireAuth()
        .then(user => {
            if (user) root.style.visibility = "";
            return user;
        })
        .catch(error => {
            root.style.visibility = "";
            throw error;
        });

    guard.catch(() => {});
    window.EspectroCareAuthGuard = guard;
})();
