//Respect this guy - he just saved my life.
//https://github.com/StoreClerk/AdF.ly-Skipper
//Credit: StoreClerk/AdF.ly-Skipper
//Source: https://github.com/StoreClerk/AdF.ly-Skipper/blob/master/AdF.ly%20Skipper/js/script.js

//The only challenge is I need to wrap it into another string again.
var wrapped_by_str = [
    `
// AdF.ly skipper script
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
    // Insert the AdF.ly skipper script
    var script = document.createElement('script');
    script.textContent = code;
    document.documentElement.appendChild(script);
}
`].join("");

const {
        Builder, By, Key, until
    } = require('selenium-webdriver');
const app_config = require("./app_config.js");

var wrapped_by_selenium = async function (driver, link) {
    var http_timeout = app_config.http_timeout_extend;

    console.log(`wrapped_by_selenium(${link})`);

    await driver.get(link);
    await driver.wait(until.elementLocated(By.css(`body`)), http_timeout, "Timeout: Waiting for adfly page");
    await driver.sleep(1000);
    await driver.executeScript(wrapped_by_str); //await driver.get(dl_s);
    var answer = await driver.getCurrentUrl();
    console.log({ link, answer });
    return answer;
};

var called_by_9tensu_explore = async function (driver, album_map, dl_sites) {
    var kv_arr = Object.entries(album_map);

    var split_dl_links = async function (kv_pair) {
        let original_arr = kv_pair[1].dl_links;
        let hit_arr = [];
        let miss_arr = [];

        let match_pattern = function (s, a_p) {
            try {
                return (s && a_p) ? a_p.includes(url.parse(s).host) : false;
            } catch (e) {
                console.log(e);
                return false;
            }
        };

        let p_fnc = function (original_link) {
            return new Promise((t, f) => {
                wrapped_by_selenium(driver, original_link).then((modified_link) => {
                    console.log(modified_link);
                    if (match_pattern(modified_link, dl_sites)) {
                        hit_arr.push(modified_link);
                    } else {
                        miss_arr.push(modified_link);
                    }
                    t();
                }).catch((e) => {
                    console.log(e);
                    f();
                    });
            });
        };

        try {
            await original_arr.reduce((p, original_link) => {
                return p.then(() => { return p_fnc(original_link); });
            }, Promise.resolve());
        } catch (e) {
            console.log(e);
        }

        //album_map[kv_pair[0]].dl_links = hit_arr;
        //album_map[kv_pair[0]].dl_links_unsolved = miss_arr;
    };

    await kv_arr.reduce((p, kv_pair) => {
        return p.then(() => { return split_dl_links(kv_pair); });
    }, Promise.resolve());
    return album_map;
};


var exports = module.exports = {
    wrapped_by_str: wrapped_by_str,
    wrapped_by_selenium: wrapped_by_selenium,
    called_by_9tensu_explore: called_by_9tensu_explore
};