const fs = require('fs');
const CHOICES = fs.readdirSync(`${__dirname}/templates`);

const SELECTPROJECT = {
  name: 'project-choice',
  type: 'list',
  message: 'What project template would you like to generate?',
  choices: CHOICES
}

module.exports.SELECTPROJECT = SELECTPROJECT;
const COREQUESTIONS = [
  {
    name: 'project-name',
    type: 'input',
    message: 'Project name:',
    validate: function (input) {
      if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
      else return 'Project name may only include letters, numbers, underscores and hashes.';
    }
  },
  {
    name: 'database-name',
    type: 'input',
    message: 'Database name:',
    validate: function (input) {
      if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
      else return 'Database name may only include letters, numbers, underscores and hashes.';
    }
  }
];
module.exports.COREQUESTIONS = COREQUESTIONS;

const ROUTEQUESTIONS = [
  {
    name: 'model-name',
    type: 'input',
    message: 'Model name: ',
    validate: function (input) {
      if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
      else return 'Model name may only include letters, numbers, underscores and hashes.';
    }
  },
  {
    name: 'route-name',
    type: 'input',
    message: 'Route name (ex. api/users): '
  }
]
module.exports.ROUTEQUESTIONS = ROUTEQUESTIONS;
