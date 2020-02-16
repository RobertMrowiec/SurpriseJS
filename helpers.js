const fs = require('fs');
const pluralize = require('pluralize');
const CURR_DIR = process.cwd();

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
  if (fs.readFileSync(targetFile).includes(`crud(${modelName}`)) {
    return console.log('❗️ Selected route already has CRUD defined ❗');
  }
  const lookingString = 'const router';
  const stringToAdd = `const ${modelName} = require('../../models/${modelName}');
const { crud } = require('surprise-crud');
  
crud(${modelName}, router, { pathFromCollection: false });\n`;
  findAndReplaceFile(targetFile, lookingString, stringToAdd, true)
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

asyncExec = cmd => {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) console.warn(error);
      resolve(stdout ? stdout : stderr);
    });
  });
}

module.exports.addCrudToRouter = addCrudToRouter;
module.exports.addRouteToApplication = addRouteToApplication;
module.exports.createDirectoryContent = createDirectoryContent;
module.exports.findAndReplaceFile = findAndReplaceFile;
module.exports.upperFirstLetter = upperFirstLetter;
module.exports.asyncExec = asyncExec;