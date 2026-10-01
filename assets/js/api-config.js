(function () {
    const DEFAULT_API_BASE_URL = "https://espectrocare.onrender.com";
    const storedOverride = localStorage.getItem("espectrocare_api_base_url");

    window.EspectroCareConfig = Object.freeze({
        API_BASE_URL: (storedOverride || DEFAULT_API_BASE_URL).replace(/\/+$/, "")
    });
})();
