function selecionar(){
    document.getElementById("selecionar").style.display = "flex"
    document.getElementById("overlay").style.opacity = "1"

    
    setTimeout(() => {
        document.getElementById("selecionar").style.transform =
        "translate(-50%, -50%) translateY(0)"
    }, 10)
}

function fechar(){
 document.getElementById("selecionar").style.transform =
        "translate(-50%, -50%) translateY(200vh)"

document.getElementById("overlay").style.opacity = "0"
    
    setTimeout(() => {
document.getElementById("selecionar").style.display = "none"
    }, 500)
}
