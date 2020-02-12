#!/usr/bin/env node

const fs = require('fs');
const inquirer = require('inquirer');
const pluralize = require('pluralize');
const process = require('process');
const exec = require('child_process').exec;
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

  if (selectedProject !== 'surprisejs-core' && !fs.existsSync(`${CURR_DIR}/app.js`))
    return console.log('⚠️  app.js does not exists, maybe You are not in project root directory, or should use surprisejs-core first?  ⚠️');

  switch (selectedProject) {
    case 'surprisejs-auth':
      auth(templatePath);
      break;
    case 'surprisejs-core':
      core(templatePath);
      break;
    case 'surprisejs-cors':
      cors();
      break;
    case 'surprisejs-crud':
      crud();
      break;
    case 'surprisejs-route':
      route(templatePath);
      break;
    default:
      console.log('Something went wrong');
  }
});

auth = async templatePath => {
  const filesToCreate = fs.readdirSync(templatePath).filter(file => file.includes('.js'));
  let generateFiles = true;
  let generateMiddleware = true;
  let last = true;

  if (fs.existsSync(`${CURR_DIR}/routes/login`)) {
    const fileAnswer = await inquirer.prompt({
      name: 'overrideRoute',
      type: 'confirm',
      message: 'Are you sure you want to override actual login route?'
    })

    if (!fileAnswer.overrideRoute)
      generateFiles = false;
  }

  if (fs.existsSync(`${CURR_DIR}/middlewares/auth.js`)) {
    const middlewareAnswer = await inquirer.prompt({
      name: 'overrideMiddleware',
      type: 'confirm',
      message: 'Are you sure you want to override actual auth middleware?'
    })

    if (!middlewareAnswer.overrideMiddleware)
      generateMiddleware = false;
  }

  if (!generateFiles && !generateMiddleware)
    return

  if (generateMiddleware) {
    if (!fs.existsSync(`${CURR_DIR}/middlewares`))
      fs.mkdirSync(`${CURR_DIR}/middlewares`)

    const middlewareContent = fs.readFileSync(`${templatePath}/middleware/auth.js`)
    fs.writeFileSync(`${CURR_DIR}/middlewares/auth.js`, middlewareContent)

    if (fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes(`require('./middlewares/auth'))`))
      return

    const prefixAnswer = await inquirer.prompt({
      name: 'prefix',
      type: 'input',
      message: 'Provide Your route prefix where auth should work:'
    })
    let { prefix } = prefixAnswer
    prefix = prefix === '' ? '/' : prefix[0] === '/' ? prefix : `/${prefix}`;

    if (fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes(`app.use('`))
      last = false

    const targetFile = `${CURR_DIR}/app.js`;
    const lookingString = last ? `app.use(` : `app.use('`;
    const stringToAdd = `app.use('${prefix}', require('./middlewares/auth'));`;

    findAndReplaceFile(targetFile, lookingString, stringToAdd, last)
    console.log('💙  Auth middleware added to application successfully 💙')
  }

  if (generateFiles) {
    if (!fs.existsSync(`${CURR_DIR}/routes/login`))
      fs.mkdirSync(`${CURR_DIR}/routes/login`);

    filesToCreate.forEach(file => {
      const origFilePath = `${templatePath}/${file}`;
      const loginContent = fs.readFileSync(origFilePath, 'utf8');
      const writePath = `${CURR_DIR}/routes/login/${file}`;
      fs.writeFileSync(writePath, loginContent, 'utf8');
    });

    if (fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes(`app.use('`))
      last = false

    const targetFile = `${CURR_DIR}/app.js`;
    const lookingString = last ? `app.use(` : `app.use('`;
    const stringToAdd = `app.use('/login', require('./routes/logins/router'));`;

    findAndReplaceFile(targetFile, lookingString, stringToAdd, last)
    console.log('💙  Login route added to application successfully 💙')
  }

  if (!fs.readFileSync(`${CURR_DIR}/package.json`, 'utf8').includes('jsonwebtoken')) {
    console.log('Running npm install...')
    exec(`npm install jsonwebtoken --save`).stdout.pipe(process.stdout)
  }
};

core = templatePath => inquirer.prompt(COREQUESTIONS).then(answers => {
  const projectName = answers['project-name'];
  const databaseName = answers['database-name'];

  fs.mkdirSync(`${CURR_DIR}/${projectName}`);
  createDirectoryContent(templatePath, projectName, databaseName);

  console.log('Running npm install...')
  exec(`cd ${projectName} && npm install`).stdout.pipe(process.stdout)
  // add here log with info about cd {project name} and run 'npm start'
});

crud = () => {
  if (SELECTCRUDROUTE(CURR_DIR) === false)
    return console.log('⚠️   Empty routes directory, use surprise-route option first ⚠️');

  inquirer.prompt(SELECTCRUDROUTE(CURR_DIR)).then(answers => {
    const selectedRoutes = answers['route-crud'];
    selectedRoutes.forEach(selectedRoute => {
      addCrudToRouter(selectedRoute);
      console.log(`💙  CRUD added to ${selectedRoute} route successfully 💙`)
    });
    if (!fs.readFileSync(`${CURR_DIR}/package.json`, 'utf8').includes('surprise-crud')) {
      console.log('Running npm install...')
      exec(`npm install surprise-crud --save`).stdout.pipe(process.stdout)
    }
  });
};

route = templatePath => inquirer.prompt(ROUTEQUESTIONS).then(answers => {
  const modelName = answers['model-name'];
  const upperFirstModelName = pluralize(upperFirstLetter(modelName), 1);
  const lowerCaseModelName = modelName.toLowerCase();
  const pluralModelName = pluralize(modelName);
  const lowerCasePluralModelName = pluralModelName.toLowerCase();
  const filesToCreate = fs.readdirSync(templatePath);

  let routeName = answers['route-name'];
  routeName = routeName[0] === '/' ? routeName : `/${routeName}`;
  const response = addRouteToApplication(routeName, lowerCasePluralModelName);

  if (!response)
    return console.log('⚠️  app.js does not exists, maybe You are in wrong directory?  ⚠️');

  fs.mkdirSync(`${CURR_DIR}/routes/${lowerCasePluralModelName}`);
  filesToCreate.forEach(file => {
    const origFilePath = `${templatePath}/${file}`;
    if (file === 'model.js') {
      const writePath = `${CURR_DIR}/models/${upperFirstModelName}.js`;
      const modelContent = fs.readFileSync(origFilePath, 'utf8')
        .replace(/Your-model-name/g, upperFirstModelName)
        .replace(/Your-lower-model-name/g, lowerCaseModelName);

      fs.writeFileSync(writePath, modelContent, 'utf8');
    } else {
      const writePath = `${CURR_DIR}/routes/${lowerCasePluralModelName}/${file}`;
      const content = fs.readFileSync(origFilePath, 'utf8')
        .replace(/Your-model-name/g, upperFirstModelName)
        .replace(/Your-lower-model-name/g, lowerCaseModelName);

      fs.writeFileSync(writePath, content, 'utf8');
    }
  });
  console.log(`💙  ${upperFirstModelName} model and route added to application successfully 💙`)
});

cors = () => {
  if (fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes(`app.use(require('surprise-cors')`))
    return console.log('⚠️  This application already has CORS defined  ⚠️');

  const targetFile = `${CURR_DIR}/app.js`
  const lookingString = `app.use(`;
  const stringToAdd = `app.use(require('surprise-cors')('*')) // You can replace '*' to array of hosts like ["http://localhost:4200", "https://www.myapp.com"];`;
  findAndReplaceFile(targetFile, lookingString, stringToAdd)
  console.log('💙  Default CORS added to app.js successfully 💙');

  if (!fs.readFileSync(`${CURR_DIR}/package.json`, 'utf8').includes('surprise-cors')) {
    console.log('Running npm install...')
    exec(`npm install surprise-cors --save`).stdout.pipe(process.stdout)
  }
};

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

addRouteToApplication = (routeName, lowerCaseName) => {
  if (!fs.existsSync(`${CURR_DIR}/app.js`))
    return false;

  const targetFile = `${CURR_DIR}/app.js`;
  const lookingString = `app.use(`
  const stringToAdd = `app.use('${routeName}', require('./routes/${lowerCaseName}/router'))\n`;
  findAndReplaceFile(targetFile, lookingString, stringToAdd, true)

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

findAndReplaceFile = (targetFile, lookingString, stringToAdd, last = false) => {
  const content = fs.readFileSync(targetFile, 'utf8');
  const contentArray = content.split('\n');
  const reversedContentArray = content.split('\n').reverse();
  const lookingPart = last ? reversedContentArray.find(string => string.includes(lookingString)) : contentArray.find(string => string.includes(lookingString))
  const lookingPartIndex = last ? reversedContentArray.indexOf(lookingPart) : contentArray.indexOf(lookingPart);

  if (last)
    reversedContentArray.splice(lookingPartIndex - 1, 0, stringToAdd);
  else
    contentArray.splice(lookingPartIndex, 0, stringToAdd);

  if (last)
    fs.writeFileSync(targetFile, reversedContentArray.reverse().join('\n'));
  else
    fs.writeFileSync(targetFile, contentArray.join('\n'));
}