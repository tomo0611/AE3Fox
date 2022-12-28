var url = window.location.href;

console.log("link -> " + url);

const baseURL = window.location.origin;

injectScript("./scripts/enableSelection.js");

// https://fonts.google.com/?preview.text=%20%E7%94%9F%E5%BE%92%E7%95%AA%E5%8F%B7%EF%BC%9A%20%E5%8F%A4%E6%A9%8B%20%E6%96%87%E4%B9%83(10%2F23)%20%E5%AD%A6%E5%B9%B4%EF%BC%9A%20%E9%AB%98%EF%BC%93%20&preview.text_type=custom&subset=japanese

function injectScript(scriptName) {
    return new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = browser.runtime.getURL(scriptName);
        s.onload = function () {
            resolve(true);
        };
        (document.head || document.documentElement).appendChild(s);
    });
}

function injectStyleSheet(styleName, font_name) {
    return new Promise(function (resolve, reject) {
        var s = document.createElement("link");
        s.href = browser.runtime.getURL(styleName);
        s.rel = "stylesheet";
        s.onload = function () {
            resolve(true);
        };
        (document.head || document.documentElement).appendChild(s);
        var elements = document.querySelectorAll("*");
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.fontFamily = '"' + font_name + '"';
        }
    });
}

// ReactのhandleClickを使ってるけどそれの動的呼び出しの実装に苦労した、、
// https://stackoverflow.com/questions/40091000/simulate-click-event-on-react-element
function invokeClick(element) {
    const mouseClickEvents = ["mousedown", "click", "mouseup"];
    mouseClickEvents.forEach((mouseEventType) =>
        element.dispatchEvent(
            new MouseEvent(mouseEventType, {
                view: window,
                bubbles: true,
                cancelable: true,
                buttons: 1,
            })
        )
    );
}

let currentQuestions = {};

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#connection-based_messaging
let myPort = browser.runtime.connect({ name: "port-from-cs" });

myPort.onMessage.addListener((m) => {
    console.log(m);
    currentQuestions = m;
});

let lastWord = "";
let isResultPage = false;

setInterval(function () {
    if (
        document.getElementsByClassName(
            "MultipleChoiceQuestionBuilder__question___3Xy0n lang-ja"
        ).length == 1 // 問題表示中
    ) {
        let tango = document.getElementsByClassName(
            "MultipleChoiceQuestionBuilder__question___3Xy0n lang-ja"
        )[0].innerText;
        isResultPage = false;
        if (tango != lastWord && currentQuestions != {}) {
            lastWord = tango;
            for (var i = 0; currentQuestions.questions.length; i++) {
                if (
                    currentQuestions.questions[i].keyword.en == lastWord ||
                    currentQuestions.questions[i].keyword.ja == lastWord
                ) {
                    let currentQ = currentQuestions.questions[i];
                    console.log(currentQ);

                    // 日本語->英語の時は答えになってしまうので読み上げない
                    if (currentQuestions.questions[i].keyword.en == lastWord) {
                        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio
                        new Audio(currentQ.sound).play();
                    }

                    let choices = document.getElementsByClassName(
                        "MultipleChoiceQuestionBuilder__choices___2a5l7"
                    )[0].children[0].children;

                    for (var j = 0; j < choices.length; j++) {
                        let span =
                            choices[j].children[0].children[0].children[0]
                                .children[0].children[0];
                        span.innerText = j + 1 + ". " + span.innerText;
                    }

                    // https://stackoverflow.com/questions/4416505/how-to-take-keyboard-input-in-javascript
                    window.addEventListener(
                        "keydown",
                        function (event) {
                            console.log(event.key);

                            switch (event.key) {
                                case "1":
                                    invokeClick(
                                        choices[0].children[0].children[0]
                                    );
                                    break;
                                case "2":
                                    invokeClick(
                                        choices[1].children[0].children[0]
                                    );
                                    break;
                                case "3":
                                    invokeClick(
                                        choices[2].children[0].children[0]
                                    );
                                    break;
                                case "4":
                                    invokeClick(
                                        choices[3].children[0].children[0]
                                    );
                                    break;
                                case "5":
                                    invokeClick(
                                        choices[4].children[0].children[0]
                                    );
                                    break;
                                default:
                                    return; // Quit when this doesn't handle the key event.
                            }
                        },
                        true
                    );
                }
            }
        }
    } else if (
        !isResultPage &&
        document.getElementsByClassName("ScoreView__answerScore___2fi7A")
            .length == 1 // 結果表示中
    ) {
        isResultPage = true;
        let tableBody = document.getElementsByClassName(
            "DescriptionBoxView__descriptionBox___39CvV"
        )[0].children[0].children[1];
        for (var i = 0; i < tableBody.children.length; i++) {
            let wordTableData = tableBody.children[i].children[1];
            wordTableData.innerHTML =
                '<a href="https://tomo0611.jp/roxy/' +
                wordTableData.innerText +
                '" target="_blank">' +
                wordTableData.innerText +
                "</a>";
        }

        document.getElementById(
            "reTryButton"
        ).children[0].children[0].innerText = "続ける (R)";

        document.getElementById(
            "quitButton"
        ).children[0].children[0].innerText = "終了 (Q)";

        window.addEventListener(
            "keydown",
            function (event) {
                console.log(event.key);

                switch (event.key) {
                    case "r":
                        invokeClick(document.getElementById("reTryButton"));
                        break;
                    case "q":
                        invokeClick(document.getElementById("quitButton"));
                        break;
                    default:
                        return; // Quit when this doesn't handle the key event.
                }
            },
            true
        );
    }
}, 10);
