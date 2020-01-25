const fs = require('fs');
const CURR_DIR = process.cwd();

module.exports.CURR_DIR = CURR_DIR;

module.exports.SELECTCRUDROUTE = currentDir => {
  if (fs.existsSync(`${currentDir}/routes`)){
    const choices = fs.readdirSync(`${currentDir}/routes`, { withFileTypes: true })
      .filter(directory => directory.name[0] !== '.')

    if (choices.length > 0) {
      return {
        name: 'route-crud',
        type: 'checkbox',
        message: 'Select for which route You want to add default crud: ',
        choices
      }
    } else {
      return false
    }
  }
  return false
}

const SELECTPROJECT = {
  name: 'project-choice',
  type: 'list',
  message: 'What project template would you like to generate?',
  choices: fs.readdirSync(`${__dirname}/templates`)
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
