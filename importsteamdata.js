const request = require('request');
const db = require('./dbconnection.js');
const cheerio = require('cheerio');
db.connect(function (err) {
    if (err) throw err;
    console.log("Connected to db!");
});

DeleteData();
InsertGameDataToDb();

function InsertGameDataToDb() {
    request.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/', function (error, response, body) {
        var jsonObjList = JSON.parse(body).applist.apps;
        asyncForEach(jsonObjList, async (element) => { // iterate through steam apps
            await sleep(1500);                      // sleep to prevent rate limiting
            var appid = element["appid"];
            console.log(`Retrieving review count of ${appid}...`);
            var gameData;
            try {
                gameData = await GetGameData(appid);
            }
            catch (e) {
                console.log("Failed to retrieve game data.");
                return;
            }

            console.log(`Inserting ${element["name"]}, ${appid}, ${gameData.reviewCount} into database...`);

            db.query('INSERT INTO games(appid, name, reviewcount, currentprice, description, headerimage, releasedate) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [element["appid"], element["name"], gameData.reviewCount, gameData.price, gameData.description, gameData.header_image, gameData.date],
                (err, result) => {
                    if (err) console.log(err);
                    else console.log(result);
                });
            gameData.genres.forEach(function (element) {
                db.query('SELECT * FROM tags WHERE description = ?', element.description, (err, result) => {
                    if (result.length == 0) {
                        db.query('INSERT INTO tags(tagindex, description) VALUES (?, ?)',
                            [element.id, element.description],
                            (err, result) => {
                                if (err) console.log(err);
                            });
                    }
                    db.query('INSERT INTO games_tags(gameindex, tagindex) VALUES (?, ?)', [appid, element.id], (err, result) => {
                        if (err) console.log(err);
                    });
                });
            });


        });

    });
}
function GetGameData(gameId) {
    return new Promise((resolve, reject) => {
        request.get(`https://store.steampowered.com/api/appdetails?appids=${gameId}`, { timeout: 5000 }, function (error, response, body) {
            if (error) {
                reject(null);
                return;
            }
            var gameData = JSON.parse(body)[gameId];
            if (gameData.success == false) {
                reject(null);
                return;
            }

            var reviewCount = 0, price = 0, description = '', header_image = '', date = '', genres = [];
            if (gameData.data.hasOwnProperty('recommendations')) {
                reviewCount = gameData.data.recommendations.total;
            }
            if (gameData.data.hasOwnProperty('price_overview')) {
                price = gameData.data.price_overview.initial;
            }
            if (gameData.data.hasOwnProperty('short_description')) {
                description = gameData.data.short_description;
            }
            if (gameData.data.hasOwnProperty('header_image')) {
                header_image = gameData.data.header_image;
            }
            if (gameData.data.hasOwnProperty('genres')) {
                genres = gameData.data.genres;
            }
            if (gameData.data.hasOwnProperty('release_date')) {
                date = gameData.data.release_date.date;
            }
            resolve({
                'reviewCount': reviewCount,
                'price': price,
                'description': description,
                'header_image': header_image,
                'genres': genres,
                'date': date
            });
        });
    })
}

function DeleteData() {
    db.query('DELETE FROM games WHERE 1=1', (err, result) => {
        if (err) console.log(err);
        else console.log(result);
    });
    db.query('DELETE FROM games_tags WHERE 1=1', (err, result) => {
        if (err) console.log(err);
        else console.log(result);
    });
    db.query('DELETE FROM tags WHERE 1=1', (err, result) => {
        if (err) console.log(err);
        else console.log(result);
    });
}
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    })
}

// function GetReviewData(gameId) {
//     return new Promise((resolve, reject) => {
//         var reviewCount = 0;
//         request.get(`https://store.steampowered.com/app/${gameId}`, function (error, response, body) {
//             if (error) reject(error);
//             var $ = cheerio.load(body);
//             console.log($('meta[itemprop="reviewCount"]').attr('content'));
//             if ($('meta[itemprop="reviewCount"]').attr('content') === null || $('meta[itemprop="reviewCount"]').attr('content') === undefined) {
//                 resolve(null);
//             }
//             else {
//                 reviewCount = $('meta[itemprop="reviewCount"]').attr('content').trim();
//                 resolve(reviewCount);
//             }
//         })
//     })
// }