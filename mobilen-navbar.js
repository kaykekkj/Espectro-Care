function AbrirMenu() {
    if (document.getElementById("navlinks").style.transform == "translateX(0%)") {
        document.getElementById("navlinks").style.transform = "translateX(100%)";
    } else {
        document.getElementById("navlinks").style.transform = "translateX(0%)";
    }
}
