document.getElementById("downloadButton").addEventListener("click", function() {

    var downloadLink = document.createElement("a");
    
    downloadLink.href = "cv/rehema.pdf";

    downloadLink.download = "Rehema_CV.pdf";
    
    document.body.appendChild(downloadLink);

    downloadLink.click();
    
    document.body.removeChild(downloadLink);
});

var typed = new Typed(".typing", {
    strings: ["Web developer", "UX/UI designer", "App Developer", "App Tester"],
    typeSpeed: 100,
    backSpeed: 60,
    loop: true  
});
