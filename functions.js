const fs = require('fs');
const process = require('process');
const inquirer = require('inquirer');
const pluralize = require('pluralize');
const CURR_DIR = process.cwd();
const {
  COREQUESTIONS,
  ROUTEQUESTIONS,
  SELECTCRUDROUTE,
  SELECTPROJECT,
} = require('./questions');

const {
  addCrudToRouter,
  addRouteToApplication,
  asyncExec,
  createDirectoryContent,
  findAndReplaceFile,
  upperFirstLetter,
} = require('./helpers');

const auth = async templatePath => {
  const filesToCreate = fs.readdirSync(templatePath).filter(file => file.includes('.js'));
  let generateFiles = true;
  let generateMiddleware = true;
  let last = true;

  if (fs.existsSync(`${CURR_DIR}/routes/login`)) {
    const fileAnswer = await inquirer.prompt({
      name: 'overrideRoute',
      type: 'confirm',
      message: 'Are you sure you want to override actual login route?',
    });

    if (!fileAnswer.overrideRoute) generateFiles = false;
  }

  if (fs.existsSync(`${CURR_DIR}/middlewares/auth.js`)) {
    const middlewareAnswer = await inquirer.prompt({
      name: 'overrideMiddleware',
      type: 'confirm',
      message: 'Are you sure you want to override actual auth middleware?',
    });

    if (!middlewareAnswer.overrideMiddleware) generateMiddleware = false;
  }

  if (!generateFiles && !generateMiddleware) return;

  if (generateMiddleware) {
    if (!fs.existsSync(`${CURR_DIR}/middlewares`)) fs.mkdirSync(`${CURR_DIR}/middlewares`);

    const middlewareContent = fs.readFileSync(`${templatePath}/middleware/auth.js`);
    fs.writeFileSync(`${CURR_DIR}/middlewares/auth.js`, middlewareContent);

    if (fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes('require(\'./middlewares/auth\'))')) return;

    const prefixAnswer = await inquirer.prompt({
      name: 'prefix',
      type: 'input',
      message: 'Provide Your route prefix where auth should work:',
    });
    let { prefix } = prefixAnswer;
    prefix = prefix === '' ? '/' : prefix[0] === '/' ? prefix : `/${prefix}`;

    if (fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes('app.use(\'')) last = false;

    const targetFile = `${CURR_DIR}/app.js`;
    const lookingString = last ? 'app.use(' : 'app.use(\'';
    const stringToAdd = `app.use('${prefix}', require('./middlewares/auth'));\n`;

    findAndReplaceFile(targetFile, lookingString, stringToAdd, last);
    console.log('💙  Auth middleware added to application successfully 💙');
  }

  if (generateFiles) {
    if (!fs.existsSync(`${CURR_DIR}/routes/login`)) fs.mkdirSync(`${CURR_DIR}/routes/login`);

    filesToCreate.forEach(file => {
      const origFilePath = `${templatePath}/${file}`;
      const loginContent = fs.readFileSync(origFilePath, 'utf8');
      const writePath = `${CURR_DIR}/routes/login/${file}`;
      fs.writeFileSync(writePath, loginContent, 'utf8');
    });

    if (fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes('app.use(\'')) last = false;

    const targetFile = `${CURR_DIR}/app.js`;
    const lookingString = last ? 'app.use(' : 'app.use(\'';
    const stringToAdd = 'app.use(\'/login\', require(\'./routes/login/router\'));';

    findAndReplaceFile(targetFile, lookingString, stringToAdd, last);
    console.log('💙  Login route added to application successfully 💙');
  }

  if (!fs.readFileSync(`${CURR_DIR}/package.json`, 'utf8').includes('jsonwebtoken')) {
    console.log('Running npm install...');
    const installResponse = await asyncExec('npm install jsonwebtoken --save');
    console.log(installResponse);
  }

  return setTimeout(() => main(), 750);
};

const core = templatePath => inquirer.prompt(COREQUESTIONS).then(async answers => {
  const projectName = answers['project-name'];
  const databaseName = answers['database-name'];

  if (fs.existsSync(`${CURR_DIR}/${projectName}`))
    return console.log('❗️ Project with specific folder name already exists ❗️');

  fs.mkdirSync(`${CURR_DIR}/${projectName}`);
  createDirectoryContent(templatePath, projectName, databaseName);

  console.log('Running npm install...');
  const installResponse = await asyncExec(`cd ${projectName} && npm install`);
  console.log(installResponse);
  return console.log(`💙  Now please move to project folder (type: cd ${projectName}) and run npm start 💙`);
});

const crud = async () => {
  if (SELECTCRUDROUTE(CURR_DIR) === false)
    return console.log('⚠️   Empty routes directory, use surprise-route option first ⚠️');

  await inquirer.prompt(SELECTCRUDROUTE(CURR_DIR)).then(answers => {
    const selectedRoutes = answers['route-crud'];
    selectedRoutes.forEach(selectedRoute => {
      addCrudToRouter(selectedRoute);
      console.log(`💙  CRUD added to ${selectedRoute} route successfully 💙`);
    });
  });

  if (!fs.readFileSync(`${CURR_DIR}/package.json`, 'utf8').includes('surprise-crud')) {
    console.log('Running npm install...');
    const installResponse = await asyncExec('npm install surprise-crud --save');
    console.log(installResponse);
  }

  return setTimeout(() => main(), 750);
};

const cors = async () => {
  if (
    fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes('app.use(require(\'surprise-cors\')')
    || fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes('require(\'cors\')')
    || fs.readFileSync(`${CURR_DIR}/app.js`, 'utf8').includes('require("cors")')
  ) return console.log('❗️ This application already has CORS defined ❗️');

  const { corsType } = await inquirer.prompt({
    name: 'corsType',
    message: 'Select which type of CORS do You need',
    type: 'list',
    choices: [
      {
        name: 'Basic (only origin (URLs) and Headers are customizable)',
        value: 'Basic',
      },
      {
        name: 'Advanced (full CORS configuration)',
        value: 'Advanced',
      },
    ],
  });

  const targetFile = `${CURR_DIR}/app.js`;
  const lookingString = 'app.use(';
  if (corsType === 'Advanced') {
    const stringToAdd = 'app.use(cors())';
    findAndReplaceFile(targetFile, lookingString, stringToAdd);
    const lookingImportString = '= require(';
    const importStringToAdd = 'const cors = require(\'cors\')';
    findAndReplaceFile(targetFile, lookingImportString, importStringToAdd);
    if (!fs.readFileSync(`${CURR_DIR}/package.json`, 'utf8').includes('"cors')) {
      console.log('Running npm install...');
      const installResponse = await asyncExec('npm install cors --save');
      console.log(installResponse);
    }
  } else {
    // eslint-disable-next-line max-len
    const stringToAdd = 'app.use(require(\'surprise-cors\')(\'*\')) // You can replace \'*\' to array of hosts like ["http://localhost:4200", "https://www.myapp.com"]';
    findAndReplaceFile(targetFile, lookingString, stringToAdd);
    if (!fs.readFileSync(`${CURR_DIR}/package.json`, 'utf8').includes('surprise-cors')) {
      console.log('Running npm install...');
      const installResponse = await asyncExec('npm install surprise-cors --save');
      console.log(installResponse);
    }
  }
  console.log('💙  Default CORS added to app.js successfully 💙');
  return setTimeout(() => main(), 750);
};

const route = templatePath => inquirer.prompt(ROUTEQUESTIONS).then(answers => {
  const modelNameAnswer = answers['model-name'];
  const modelName = modelNameAnswer.includes('/') ? modelNameAnswer.split('/').pop() : modelNameAnswer;
  const upperFirstModelName = pluralize(upperFirstLetter(modelName), 1);
  const lowerCaseModelName = modelName.toLowerCase();
  const pluralModelName = pluralize(modelName);
  const lowerCasePluralModelName = pluralModelName.toLowerCase();
  const filesToCreate = fs.readdirSync(templatePath);

  if (modelNameAnswer.includes('/')) {
    const arr = modelNameAnswer.split('/');
    arr.pop();
    let currentDir = `${CURR_DIR}/routes`;
    let currentModelDir = `${CURR_DIR}/models`;
    const arrLength = arr.length;

    while (arr.length > 0) {
      if (!fs.existsSync(`${currentDir}/${arr[0]}`))
        fs.mkdirSync(`${currentDir}/${arr[0]}`);

      if (!fs.existsSync(`${currentModelDir}/${arr[0]}`))
        fs.mkdirSync(`${currentModelDir}/${arr[0]}`);

      currentDir = `${currentDir}/${arr}`;
      currentModelDir = `${currentModelDir}/${arr}`;
      arr.shift();
    }

    let routeName = answers['route-name'];
    routeName = routeName[0] === '/' ? routeName : `/${routeName}`;
    const routePath = `${currentDir.split('/routes/')[1]}/${lowerCasePluralModelName}`;
    addRouteToApplication(routeName, routePath);

    fs.mkdirSync(`${currentDir}/${lowerCasePluralModelName}`);
    filesToCreate.forEach(file => {
      const origFilePath = `${templatePath}/${file}`;
      if (file === 'model.js') {
        // const currentModelDir = currentDir.replace('routes', 'models');
        const writePath = `${currentModelDir}/${upperFirstModelName}.js`;
        const modelContent = fs.readFileSync(origFilePath, 'utf8')
          .replace(/Your-model-name/g, upperFirstModelName)
          .replace(/Your-lower-model-name/g, lowerCaseModelName);

        fs.writeFileSync(writePath, modelContent, 'utf8');
      } else {
        const writePath = `${currentDir}/${lowerCasePluralModelName}/${file}`;
        const nestedPathToAdd = ('../').repeat(arrLength);
        const content = fs.readFileSync(origFilePath, 'utf8')
          .replace(/Your-model-name/g, upperFirstModelName)
          .replace(/Your-lower-model-name/g, lowerCaseModelName)
          .replace('../models', `${nestedPathToAdd}../models/${currentDir.split('routes/')[1]}`);

        fs.writeFileSync(writePath, content, 'utf8');
      }
    });
  } else {
    let routeName = answers['route-name'];
    routeName = routeName[0] === '/' ? routeName : `/${routeName}`;
    addRouteToApplication(routeName, lowerCasePluralModelName);

    if (fs.existsSync(`${CURR_DIR}/routes/${lowerCasePluralModelName}`))
      return console.log('❗️ Specific route already exists ❗️');

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
  }

  console.log(`💙  ${upperFirstModelName} model and route added to application successfully 💙`);
  return setTimeout(() => main(), 750);
});

const main = () => inquirer.prompt(SELECTPROJECT).then(answer => {
  const selectedProject = answer['project-choice'];
  const templatePath = `${__dirname}/templates/${selectedProject}`;

  if (selectedProject !== 'core' && !fs.existsSync(`${CURR_DIR}/app.js`))
    return console.log('⚠️  app.js does not exists, maybe You are not in project root directory, or should use surprisejs-core first?  ⚠️');

  switch (selectedProject) {
    case 'auth':
      auth(templatePath);
      break;
    case 'core':
      core(templatePath);
      break;
    case 'cors':
      cors();
      break;
    case 'crud':
      crud();
      break;
    case 'route':
      route(templatePath);
      break;
    default:
      console.log('Something went wrong');
  }
});

module.exports = {
  auth,
  core,
  cors,
  crud,
  main,
  route,
};
