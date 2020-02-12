#!/usr/bin/env node

const fs = require('fs');
const inquirer = require('inquirer');
const pluralize = require('pluralize');
const process = require('process');
// const exec = require('child_process').exec;
const {
  SELECTPROJECT,
  COREQUESTIONS,
  ROUTEQUESTIONS,
  SELECTCRUDROUTE,
  CURR_DIR
} = require('./questions');

inquirer.prompt(SELECTPROJECT).then(answer => {
  const selectedProject = answer['project-choice'];
  const templatePath = `${__dirname}/templates/${selectedProject}`;

  if (
    selectedProject !== 'surprisejs-core' &&
    !fs.existsSync(`${CURR_DIR}/app.js`)
  ) {
    return console.log(
      '⚠️  app.js does not exists, maybe You are in wrong directory?  ⚠️'
    );
  }

  switch (selectedProject) {
    case 'surprisejs-auth':
      authCLI(templatePath);
      break;
    case 'surprisejs-core':
      coreCLI(templatePath);
      break;
    case 'surprisejs-cors':
      corsCLI();
      break;
    case 'surprisejs-crud':
      crudCLI();
      break;
    case 'surprisejs-route':
      routeCLI(templatePath);
      break;
    default:
      console.log('Something went wrong');
  }
});

authCLI = async templatePath => {
  const filesToCreate = fs.readdirSync(templatePath).filter(file => file.includes('.js'));
  let generateFiles = true;
  let generateMiddleware = true;
  if (fs.existsSync(`${CURR_DIR}/routes/login`)) {
    const fileAnswer = await inquirer.prompt({
      name: 'overrideRoute',
      type: 'confirm',
      message: 'Are you sure you want to override actual login route?'
    })
    if (!fileAnswer.overrideRoute) generateFiles = false;
  }

  if (fs.existsSync(`${CURR_DIR}/middlewares/auth.js`)) {
    const middlewareAnswer = await inquirer.prompt({
      name: 'overrideMiddleware',
      type: 'confirm',
      message: 'Are you sure you want to override actual auth middleware?'
    })
    if (!middlewareAnswer.overrideMiddleware) generateMiddleware = false;
  }

  if (!generateFiles && !generateMiddleware) return

  if (generateMiddleware) {
    if (!fs.existsSync(`${CURR_DIR}/middlewares`)) fs.mkdirSync(`${CURR_DIR}/middlewares`)
    const middlewareContent = fs.readFileSync(`${templatePath}/middleware/auth.js`)
    fs.writeFileSync(`${CURR_DIR}/middlewares/auth.js`, middlewareContent)

    if (fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes(`require('./middlewares/auth'))`)) return

    const prefixAnswer = await inquirer.prompt({
      name: 'prefix',
      type: 'input',
      message: 'Provide Your route prefix where auth should work:'
    })
    let { prefix } = prefixAnswer
    prefix = prefix === '' ? '/' : prefix[0] === '/' ? prefix : `/${prefix}`;

    const targetFile = `${CURR_DIR}/app.js`;
    const lookingString = `app.use('`;
    const stringToAdd = `app.use('${prefix}', require('./middlewares/auth'));`;
    findAndReplaceFile(targetFile, lookingString, stringToAdd)
  }

  if (generateFiles) {
    if (!fs.existsSync(`${CURR_DIR}/routes/login`)) fs.mkdirSync(`${CURR_DIR}/routes/login`);
    filesToCreate.forEach(file => {
      const origFilePath = `${templatePath}/${file}`;
      const loginContent = fs.readFileSync(origFilePath, 'utf8');
      const writePath = `${CURR_DIR}/routes/login/${file}`;
      fs.writeFileSync(writePath, loginContent, 'utf8');
    });
    const targetFile = `${CURR_DIR}/app.js`;
    const lookingString = `app.use('`;
    const stringToAdd = `app.use('/login', require('./routes/logins/router'));`;
    findAndReplaceFile(targetFile, lookingString, stringToAdd)
  }
};

coreCLI = templatePath => inquirer.prompt(COREQUESTIONS).then(answers => {
  const projectName = answers['project-name'];
  const databaseName = answers['database-name'];

  fs.mkdirSync(`${CURR_DIR}/${projectName}`);
  createDirectoryContent(templatePath, projectName, databaseName);

  console.log('Running npm install')
  const exec = require('child_process').exec;
  child = exec(`cd ${projectName} && npm install`).stdout.pipe(process.stdout)
});

crudCLI = () => {
  if (SELECTCRUDROUTE(CURR_DIR) === false) {
    console.log('⚠️  Empty routes directory, use surprise-route option ⚠️');
    return;
  }

  inquirer.prompt(SELECTCRUDROUTE(CURR_DIR)).then(answers => {
    const selectedRoutes = answers['route-crud'];
    selectedRoutes.forEach(selectedRoute => {
      addCrudToRouter(selectedRoute);
    });
  });
};

routeCLI = templatePath => inquirer.prompt(ROUTEQUESTIONS).then(answers => {
  const modelName = answers['model-name'];
  const upperFirstModelName = pluralize(upperFirstLetter(modelName), 1);
  const lowerCaseModelName = modelName.toLowerCase();
  const pluralModelName = pluralize(modelName);
  const filesToCreate = fs.readdirSync(templatePath);
  let routeName = answers['route-name'];
  routeName = routeName[0] === '/' ? routeName : `/${routeName}`;
  const response = addRouteToApplication(routeName, pluralModelName);

  if (!response) {
    return console.log('⚠️  app.js does not exists, maybe You are in wrong directory?  ⚠️');
  }

  fs.mkdirSync(`${CURR_DIR}/routes/${pluralModelName}`);
  filesToCreate.forEach(file => {
    const origFilePath = `${templatePath}/${file}`;
    if (file === 'model.js') {
      const writePath = `${CURR_DIR}/models/${upperFirstModelName}.js`;
      const modelContent = fs.readFileSync(origFilePath, 'utf8')
        .replace(/Your-model-name/g, upperFirstModelName)
        .replace(/Your-lower-model-name/g, lowerCaseModelName);

      fs.writeFileSync(writePath, modelContent, 'utf8');
    } else {
      const writePath = `${CURR_DIR}/routes/${pluralModelName}/${file}`;
      const content = fs.readFileSync(origFilePath, 'utf8')
        .replace(/Your-model-name/g, upperFirstModelName)
        .replace(/Your-lower-model-name/g, lowerCaseModelName);

      fs.writeFileSync(writePath, content, 'utf8');
    }
  });
});

createDirectoryContent = (templatePath, newProjectPath, databaseName = '') => {
  const filesToCreate = fs.readdirSync(templatePath);

  filesToCreate.forEach(file => {
    const origFilePath = `${templatePath}/${file}`;
    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      const writePath = `${CURR_DIR}/${newProjectPath}/${file}`;
      const content = fs.readFileSync(origFilePath, 'utf8').replace('Your-database-name', databaseName);
      fs.writeFileSync(writePath, content, 'utf8');
    } else if (stats.isDirectory()) {
      fs.mkdirSync(`${CURR_DIR}/${newProjectPath}/${file}`);
      createDirectoryContent(`${templatePath}/${file}`, `${newProjectPath}/${file}`);
    }
  });
};

corsCLI = () => {
  if (fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes(`app.use(require('surprise-cors')`)) {
    return console.log('⚠️  This application already has CORS defined  ⚠️');
  }
  const targetFile = `${CURR_DIR}/app.js`
  const lookingString = `app.use('`
  const stringToAdd = `app.use(require('surprise-cors')('*')) // You can replace '*' to array of hosts like ["http://localhost:4200", "https://www.myapp.com"]; \n`;
  findAndReplaceFile(targetFile, lookingString, stringToAdd, true)
  console.log('💙 Default CORS added to app.js successfully 💙');
};

addRouteToApplication = (routeName, pluralModelName) => {
  if (!fs.existsSync(`${CURR_DIR}/app.js`)) {
    return false;
  }

  const targetFile = `${CURR_DIR}/app.js`;
  const lookingString = 'app.use(';
  const stringToAdd = `app.use('${routeName}', require('./routes/${pluralModelName}/router'))`;
  findAndReplaceFile(targetFile, lookingString, stringToAdd)
  return true;
};

addCrudToRouter = routeName => {
  const nounSelectedRoute = pluralize(routeName, 1);
  const modelName = upperFirstLetter(nounSelectedRoute);
  const targetFile = `${CURR_DIR}/routes/${routeName}/router.js`;
  const lookingString = 'const ';
  const stringToAdd = `const ${modelName} = require('../../models/${modelName}');
  const { crud } = require('surprise-crud');
  
  crud(${modelName}, router, { pathFromCollection: false });`;
  findAndReplaceFile(targetFile, lookingString, stringToAdd)
  addSurpriseCrudToPackage();
};

addSurpriseCrudToPackage = () => {
  const targetFile = `${CURR_DIR}/package.json`;
  const lookingString = 'express';
  const stringToAdd = '    "surprise-crud": "latest",';
  findAndReplaceFile(targetFile, lookingString, stringToAdd);
};

upperFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);

findAndReplaceFile = (targetFile, lookingString, stringToAdd, reverse = false) => {
  const content = fs.readFileSync(targetFile, 'utf8');
  const contentArray = content.split('\n');
  const reversedContentArray = content.split('\n').reverse();
  const lookingPart = reversedContentArray.find(string => string.includes(lookingString));
  const lookingPartIndex = contentArray.indexOf(lookingPart);
  const concatString = reverse ? `${stringToAdd}\n${lookingPart}` : `${lookingPart}\n${stringToAdd}`;
  contentArray[lookingPartIndex] = concatString;
  fs.writeFileSync(targetFile, contentArray.join('\n'));
}