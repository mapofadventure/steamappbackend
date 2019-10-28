const request = require('request');
const db = require('./dbconnection.js');
const cheerio = require('cheerio');

InsertGameDataToDb();
function InsertGameDataToDb() {
    db.connect(function (err) {
        if (err) throw err;
        console.log("Connected to db!");
    });

    request.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/', async function (error, response, body) {
        var jsonObjList = JSON.parse(body).applist.apps;
        jsonObjList = jsonObjList.slice(1, 5);
        asyncForEach(jsonObjList, async (element) => {

            console.log("Retrieving review count...");
            var reviewCount = await GetReviewData(element["appid"]);
            console.log(`Inserting ${element["name"]}, ${element["appid"]}, ${reviewCount} into database...`);
            db.query('INSERT INTO games(appid, name, reviewcount) VALUES (?, ?, ?)', [element["appid"], element["name"], reviewCount], (err, result) => {
                if (err) console.log(err);
                else console.log(result);
            });
        });

    });
}

function GetReviewData(gameId) {
    return new Promise((resolve, reject) => {
        var reviewCount = 0;
        request.get(`https://store.steampowered.com/app/${gameId}`, function (error, response, body) {
            if (error) reject(error);
            var $ = cheerio.load(body);
            console.log($('meta[itemprop="reviewCount"]').attr('content'));
            if ($('meta[itemprop="reviewCount"]').attr('content') === null || $('meta[itemprop="reviewCount"]').attr('content') === undefined) {
                resolve(0);
            }
            else {
                reviewCount = $('meta[itemprop="reviewCount"]').attr('content').trim();
                resolve(reviewCount);
            }
        })
    })
}
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
