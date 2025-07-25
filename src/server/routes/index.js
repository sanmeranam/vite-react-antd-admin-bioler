const { sample, sampleJson } = require("../controller/sample");

const routes = [
  {
     method: 'get',
     route: '/',
     middlewares: [],
     controller: sample,
   },
  {
    method: 'get',
    route: '/hello',
    middlewares: [],
    controller: sampleJson,
  },
];

module.exports = routes;