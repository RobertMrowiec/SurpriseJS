const fs = require('fs');
const pluralize = require('pluralize');

module.exports.SELECTCRUDROUTE = currentDir => {
  if (fs.existsSync(`${currentDir}/routes`)) {
    const choices = fs
      .readdirSync(`${currentDir}/routes`, { withFileTypes: true })
      .filter(directory => directory.name[0] !== '.');

    if (choices.length > 0)
      return {
        name: 'route-crud',
        type: 'checkbox',
        message: 'Select for which route You want to add crud: ',
        choices,
      };
  }
  return false;
};

const SELECTPROJECT = {
  name: 'project-choice',
  type: 'list',
  message: 'Which project template would you like to generate?',
  choices: fs.readdirSync(`${__dirname}/templates`),
  suffix: ' (ctrl + c to exit)',
};
module.exports.SELECTPROJECT = SELECTPROJECT;

const COREQUESTIONS = [
  {
    name: 'project-name',
    type: 'input',
    message: 'Project name:',
    validate(input) {
      if (/^([A-Za-z\-\d])+$/.test(input)) return true;
      return 'Project name may only include letters, numbers, underscores and hashes.';
    },
  },
  {
    name: 'database-name',
    type: 'input',
    message: 'Database name:',
    validate(input) {
      if (/^([A-Za-z\-\d])+$/.test(input)) return true;
      return 'Database name may only include letters, numbers and underscores.';
    },
  },
];
module.exports.COREQUESTIONS = COREQUESTIONS;

const ROUTEQUESTIONS = [
  {
    name: 'model-name',
    type: 'input',
    message: 'Model name: ',
    validate(input) {
      if (/^([A-Za-z/\-\d])+$/.test(input)) return true;
      return 'Model name may only include letters, numbers, underscores.';
    },
  },
  {
    name: 'route-name',
    type: 'input',
    default: answers => `api/${pluralize(answers['model-name']).toLowerCase()}`,
    message: 'Route name:',
  },
];
module.exports.ROUTEQUESTIONS = ROUTEQUESTIONS;
