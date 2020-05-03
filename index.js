const fs = require('fs')
    , request = require('request')
    , requestPromise = require('request-promise')
    , cheerio = require('cheerio');
const dir = './tmp';
const baseURL = 'https://link.springer.com';
const URL = 'https://www.thebiomics.com/notes/springer-free-e-books-list.html';

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

(async () => {
    const response = await requestPromise(URL);

    let $ = cheerio.load(response);

    let allLinks = $('td > a').toArray();
    allLinks.forEach(async anchor => {
        if (anchor.attribs.title == 'Download Link') {
            return;
        }

        await requestPromise(anchor.attribs.href, async (error, response, body) => {
            try {
                if (!error && response.statusCode == 200) {
                    let $ = cheerio.load(body);

                    let downloadLinks = $('a[title="Download this book in PDF format"]').toArray();
                    let downloadLink = baseURL + downloadLinks[0].attribs.href;
                    let fileName = anchor.attribs.title + '.pdf';

                    if (fileName.includes('View')) {
                        fileName = fileName.replace('View ', '');
                    }
                    if (fileName.includes('PDF Online')) {
                        fileName = fileName.replace(' PDF Online', '');
                    }
                    console.log(downloadLink, fileName);

                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }

                    await sleep(100);

                    request
                        .get(downloadLink)
                        .on('error', function (err) {
                            console.error(err)
                        })
                        .pipe(fs.createWriteStream(dir + '/' + fileName))
                } else {
                    console.log(error);
                }
            } catch (error) {
                console.log(error);
            }
        });
    });
})()