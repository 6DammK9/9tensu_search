//Respect this guy - he just saved my life.
//https://github.com/StoreClerk/AdF.ly-Skipper
//Credit: StoreClerk/AdF.ly-Skipper
//Source: https://github.com/StoreClerk/AdF.ly-Skipper/blob/master/AdF.ly%20Skipper/js/script.js

//The only challenge is I need to wrap it into another string again.
var wrapped_by_str = [
    `
// AdF.ly skipper script
(function () { 
var code = `, `
Object.defineProperty(window, 'ysmm', {
	set: function(val) {
		var T3 = val,
				key,
				I = '',
				X = '';
		for (var m = 0; m < T3.length; m++) {
			if (m % 2 == 0) {
				I += T3.charAt(m);
			} else {
				X = T3.charAt(m) + X;
			}
		}
		T3 = I + X;
		var U = T3.split('');
		for (var m = 0; m < U.length; m++) {
			if (!isNaN(U[m])) {
				for (var R = m + 1; R < U.length; R++) {
					if (!isNaN(U[R])) {
						var S = U[m]^U[R];
						if (S < 10) {
							U[m] = S;
						}
						m = R;
						R = U.length;
					}
				}
			}
		}
		T3 = U.join('');
		T3 = window.atob(T3);
		T3 = T3.substring(T3.length - (T3.length - 16));
		T3 = T3.substring(0, T3.length - 16);
		key = T3;
		if (key && (key.indexOf('http://') === 0 || key.indexOf("https://") === 0)) {
			document.write('<!--');
			window.stop();
			window.onbeforeunload = null;
			window.location = key;
		}
	}
});
`, `;

// Only use the script for HTML webpages
if (document instanceof HTMLDocument) {
    console.log("a");


    // Insert the AdF.ly skipper script
    var script = document.createElement('script');
    script.textContent = code;
    document.documentElement.appendChild(script);
}
console.log("b");

})();
`].join("");

const {
        Builder, By, Key, until
    } = require('selenium-webdriver');
const app_config = require("./app_config.js");

var wrapped_by_selenium = async function (driver, link) {
    var http_timeout = app_config.http_timeout_extend;

    //console.log(`wrapped_by_selenium(${link})`);

    await driver.get(link);
    //await driver.executeAsyncScript(wrapped_by_str); //await driver.get(dl_s);
    await driver.wait(until.elementLocated(By.css(`body`)), http_timeout, "Timeout: Waiting for adfly page");
    await driver.sleep(app_config.expected_loading_time_short);
    var div_warning = driver.findElements(By.id(`warning-container`));
    if (div_warning) {
        await driver.sleep(app_config.AD_FLY_TIMEOUT);
        await driver.get(link);
        //await driver.executeAsyncScript(wrapped_by_str); //await driver.get(dl_s);
        await driver.wait(until.elementLocated(By.css(`body`)), http_timeout, "Timeout: Waiting for adfly page again");
        await driver.sleep(app_config.expected_loading_time_short);
    }

    var p_arr = await driver.findElements(By.css(`p`));
    var answer = null;

    var get_text = async function (p) {
        var s = await p.getText();
        s.split(" ").forEach((s) => {
            if (s.includes("http://") || s.includes("https://")) {
                answer = s;
            }
        });
    };

    //console.log(p_arr);

    if (!p_arr) {
        answer = await driver.getCurrentUrl();
    } else {
        await p_arr.reduce((q, p) => {
            return q.then(() => { return get_text(p); });
        }, Promise.resolve());
    }

    answer = answer ? answer : await driver.getCurrentUrl();

    //console.log({ link, answer });
    return answer;
};

var exports = module.exports = {
    wrapped_by_str: wrapped_by_str,
    wrapped_by_selenium: wrapped_by_selenium
};