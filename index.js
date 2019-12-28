#!/usr/bin/env node
const fs = require('fs');
const inquirer = require('inquirer');
const pluralize = require('pluralize');
const { SELECTPROJECT, COREQUESTIONS, ROUTEQUESTIONS, SELECTCRUDROUTE, CURR_DIR } = require('./questions')

inquirer.prompt(SELECTPROJECT).then(answer => {
  const selectedProject = answer['project-choice']
  const templatePath = `${__dirname}/templates/${selectedProject}`

  switch(selectedProject) {
    case 'surprisejs-core':
      coreCLI(templatePath)
      break
    case 'surprisejs-crud':
      crudCLI()
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
  createDirectoryContent(templatePath, projectName, databaseName);
});

crudCLI = () => inquirer.prompt(SELECTCRUDROUTE(CURR_DIR)).then(answers => {
  const selectedRoutes = answers['route-crud']
  selectedRoutes.forEach(selectedRoute => {
    addCrudToRouter(selectedRoute)
  })
  


})

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

createDirectoryContent = (templatePath, newProjectPath, databaseName = '') => {
  const filesToCreate = fs.readdirSync(templatePath);

  filesToCreate.forEach(file => {
    const origFilePath = `${templatePath}/${file}`;
    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const writePath = `${CURR_DIR}/${newProjectPath}/${file}`
      const content = fs.readFileSync(origFilePath, 'utf8').replace('Your-database-name', databaseName);

      fs.writeFileSync(writePath, content, 'utf8');
    } else if (stats.isDirectory()) {
      fs.mkdirSync(`${CURR_DIR}/${newProjectPath}/${file}`);
      createDirectoryContent(`${templatePath}/${file}`, `${newProjectPath}/${file}`);
    }
  });
}

upperFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);

addRouteToApplication = (routeName, pluralModelName) => {
  const content = fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8')
  const contentArray = content.split('\n')
  const reversedContentArray = content.split('\n').reverse()
  const lookingPart = reversedContentArray.find(string => string.includes('app.use('))
  const lookingPartIndex = contentArray.indexOf(lookingPart)
  const stringToAdd = `app.use('${routeName}', require('./routes/${pluralModelName}/router'))`
  const concatString = `${lookingPart} \n${stringToAdd}`
  contentArray[lookingPartIndex] = concatString;

  fs.writeFileSync(`${CURR_DIR}/app.js`, contentArray.join('\n'));
}

addCrudToRouter = routeName => {
  const nounSelectedRoute = pluralize(routeName, 1)
  const modelName = upperFirstLetter(nounSelectedRoute)
  const content = fs.readFileSync(`${CURR_DIR}/routes/${routeName}/router.js`, 'utf8')
  const contentArray = content.split('\n')
  const reversedContentArray = content.split('\n').reverse()
  const lookingPart = reversedContentArray.find(string => string.includes('const '))
  const lookingPartIndex = contentArray.indexOf(lookingPart)
  const stringToAdd = `const ${modelName} = require('../../models/${modelName}');
const { crud } = require('surprise-crud');

crud(${modelName}, router);`
  const concatString = `${lookingPart} \n${stringToAdd}`
  contentArray[lookingPartIndex] = concatString;

  fs.writeFileSync(`${CURR_DIR}/routes/${routeName}/router.js`, contentArray.join('\n'));
}


findLastStringOccurence = (location, lookingString) => {
  
}