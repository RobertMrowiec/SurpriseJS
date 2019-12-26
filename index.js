#!/usr/bin/env node
const fs = require('fs');
const inquirer = require('inquirer');
const CURR_DIR = process.cwd();
const CHOICES = fs.readdirSync(`${__dirname}/templates`);

const SELECTPROJECT = {
  name: 'project-choice',
  type: 'list',
  message: 'What project template would you like to generate?',
  choices: CHOICES
}

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

let selectedProject
inquirer.prompt(SELECTPROJECT).then(answer => selectedProject = answer['project-choice']).then(() => {
  const templatePath = `${__dirname}/templates/${selectedProject}`;
  if (selectedProject === 'surprisejs-core'){
    inquirer.prompt(COREQUESTIONS)
    .then(answers => {
      const projectName = answers['project-name'];
      const databaseName = answers['database-name'];

      fs.mkdirSync(`${CURR_DIR}/${projectName}`);
      createDirectoryContents(templatePath, projectName, databaseName);
    });
  } else if (selectedProject === 'surprisejs-route'){
    inquirer.prompt(ROUTEQUESTIONS).then(answers => {
      const modelName = upperFirstLetter(answers['model-name'])
      const routeName = answers['route-name']
      const writePath = `${CURR_DIR}/models/${modelName}.js`
      const modelContent = fs.readFileSync(`${templatePath}/model.js`, 'utf8').replace(/Your-model-name/g, modelName);
      fs.writeFileSync(writePath, modelContent, 'utf8');

    })
  }
})

function createDirectoryContents (templatePath, newProjectPath, databaseName) {
  const filesToCreate = fs.readdirSync(templatePath);

  filesToCreate.forEach(file => {
    const origFilePath = `${templatePath}/${file}`;
    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const writePath = `${CURR_DIR}/${newProjectPath}/${file}`
      const contents = fs.readFileSync(origFilePath, 'utf8').replace('Your-database-name', databaseName);

      fs.writeFileSync(writePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      fs.mkdirSync(`${CURR_DIR}/${newProjectPath}/${file}`);
      createDirectoryContents(`${templatePath}/${file}`, `${newProjectPath}/${file}`);
    }
  });
}

upperFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);