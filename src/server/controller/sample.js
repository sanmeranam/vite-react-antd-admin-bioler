

function sample(req, res) {
    res.send('Hello World');
}

function sampleJson(req, res) {
    res.json({ message: 'Hello World from API, time:' + new Date().toISOString() });
}


module.exports = {
    sample,
    sampleJson
};