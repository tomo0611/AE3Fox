let portFromCS;

function connected(p) {
    portFromCS = p;
}

browser.runtime.onConnect.addListener(connected);

function listenerForQuestion(details) {
    console.log("Loading: " + details.url);

    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    let data = [];

    filter.ondata = (event) => {
        data.push(event.data);
    };

    filter.onstop = (event) => {
        let str = "";
        if (data.length == 1) {
            str = decoder.decode(data[0]);
        } else {
            for (let i = 0; i < data.length; i++) {
                let stream = i == data.length - 1 ? false : true;
                str += decoder.decode(data[i], { stream });
            }
        }

        portFromCS.postMessage(JSON.parse(str));

        console.log(JSON.stringify(JSON.parse(str), null, 2));
        filter.write(encoder.encode(str));
        filter.close();
    };

    return {};
}

browser.webRequest.onHeadersReceived.addListener(
    listenerForQuestion,
    {
        urls: [
            "https://acexp.ecs.osaka-cu.ac.jp/as/flash/tango_data_manipulate.cfc?method=get_question&returnformat=json&*",
        ],
    },
    ["blocking", "responseHeaders"]
);
