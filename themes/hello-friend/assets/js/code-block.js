document.addEventListener("DOMContentLoaded", () => {
    for(const hl of document.querySelectorAll(".highlight-wrapper")){
        const copyButton = hl.querySelector(".copy-button");
        // シンタックスハイライトが効かない言語のプログラムの場合、
        // pre に highlight クラスが付与されないので、pre で調べる
        const codeBlock = hl.querySelector("pre");
        let timerId = undefined;

        copyButton.addEventListener("click", () => {
            navigator.clipboard.writeText(codeBlock.textContent);
            if(timerId !== undefined){
                clearTimeout(timerId);
            }
            copyButton.textContent = "Copied!";
            timerId = setTimeout(() => {
                copyButton.textContent = "Copy";
            }, 800);
        });
    }
});
