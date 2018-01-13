const {Builder, By, Key, until} = require('selenium-webdriver');

var album_name = "枯れない世界と終わる花 オリジナルサウンドトラック";

var link = `http://www.9tensu.com/search?q=${album_name}`;

var driver = new Builder()
    .forBrowser('chrome')
    .build();

var ignore_items = ["YouTube", "SoundCloud"];
var result = {
    title: null,
    producer: null,
    date: null,
    tracks: []
};

driver.get(link).then(() => {
    driver.wait(until.titleContains(`9Tensu: Search results`), 20000, "Waiting for search results...").then(() => {
        driver.findElements(By.tagName(`a`)).then((arr_w) => {
            driver.findElement(By.partialLinkText(album_name)).then((w) => {
                //console.log("Target found!");
                //w.getText().then(console.log);
                w.getAttribute(`href`).then((s) => {
                    if (s) {
                        driver.get(s).then(() => {
                            driver.wait(until.titleContains(album_name), 40000, "Waiting for target album page...").then(() => {
                                driver.findElements(By.tagName(`li`)).then((web_elements) => {
                                    web_elements.forEach((w) => {
                                        w.getText().then((s) => {
                                            if ((s.trim().length > 0) && (ignore_items.indexOf(s) < 0)) {
                                                if (s.indexOf("Producer : ") >= 0) {
                                                    result.producer = s.replace("Producer : ", "").trim();
                                                } else if (s.indexOf("Title : ") >= 0) {
                                                    result.title = s.replace("Title : ", "").trim();
                                                } else if (s.indexOf("Release date : ") >= 0) {
                                                    result.date = s.replace("Release date : ", "").trim();
                                                } else {
                                                    result.tracks.push(s);
                                                }
                                            }
                                        });
                                    });
                                }).then(() => {
                                    console.log(JSON.stringify(result, null, 4));
                                    driver.quit();
                                });
                            });
                        });
                    } else {
                        console.log("No link found!");
                        driver.quit();
                    }
                });
            });
        });
    });
}).catch((err) => {
    console.log(err);
    driver.quit();
});