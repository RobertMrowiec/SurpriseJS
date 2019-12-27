#!/usr/bin/env node
const fs = require('fs');
const inquirer = require('inquirer');
const pluralize = require('pluralize');
const CURR_DIR = process.cwd();
const { SELECTPROJECT, COREQUESTIONS, ROUTEQUESTIONS } = require('./questions')

let selectedProject
inquirer.prompt(SELECTPROJECT).then(answer => selectedProject = answer['project-choice']).then(() => {
  const templatePath = `${__dirname}/templates/${selectedProject}`;
  switch(selectedProject) {
    case 'surprisejs-core':
      coreCLI(templatePath)
      break
    case 'surprisejs-route':
      routeCLI(templatePath)
      break
    default:
      console.log('Something went wrong');
  }
})

coreCLI = templatePath => inquirer.prompt(COREQUESTIONS).then(answers => {
  const projectName = answers['project-name'];
  const databaseName = answers['database-name'];

  fs.mkdirSync(`${CURR_DIR}/${projectName}`);
  createDirectoryContents(templatePath, projectName, databaseName);
});

routeCLI = templatePath => inquirer.prompt(ROUTEQUESTIONS).then(answers => {
  const modelName = answers['model-name']
  const upperFirstModelName = upperFirstLetter(modelName)
  const lowerCaseModelName = modelName.toLowerCase()
  const pluralModelName = pluralize(modelName)
  const filesToCreate = fs.readdirSync(templatePath);
  const routeName = answers['route-name']

  addRouteToApplication(routeName, pluralModelName)
  
  fs.mkdirSync(`${CURR_DIR}/routes/${pluralModelName}`);
  filesToCreate.forEach(file => {
    const origFilePath = `${templatePath}/${file}`;
    if (file === 'model.js'){
      const writePath = `${CURR_DIR}/models/${upperFirstModelName}.js`
      const modelContent = fs.readFileSync(origFilePath, 'utf8').replace(/Your-model-name/g, upperFirstModelName).replace(/Your-lower-model-name/g, lowerCaseModelName);

      fs.writeFileSync(writePath, modelContent, 'utf8');
    } else {
      const writePath = `${CURR_DIR}/routes/${pluralModelName}/${file}`
      const content = fs.readFileSync(origFilePath, 'utf8').replace(/Your-model-name/g, upperFirstModelName).replace(/Your-lower-model-name/g, lowerCaseModelName);

      fs.writeFileSync(writePath, content, 'utf8');
    }
  })
})

createDirectoryContents = (templatePath, newProjectPath, databaseName = '') => {
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

addRouteToApplication = (routeName, pluralModelName) => {
  const contents = fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8')
  const contentArray = contents.split('\n')
  const reversedContentArray = contents.split('\n').reverse()
  const lookingPart = reversedContentArray.find(string => string.includes('app.use('))
  const lookingPartIndex = contentArray.indexOf(lookingPart)
  const stringToAdd = `app.use('${routeName}', require('./routes/${pluralModelName}/router'))`
  const concatString = `${lookingPart} \n${stringToAdd}`
  contentArray[lookingPartIndex] = concatString;

  fs.writeFileSync(`${CURR_DIR}/app.js`, contentArray.join('\n'));
}