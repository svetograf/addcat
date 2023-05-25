//eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
//eslint-disable-next-line @typescript-eslint/no-var-requires
const {writeFile} = require('fs');

const {
  PRODUCTION = true,
  TOKEN = '',
} = process.env;

const envConfigFile = `export const environment = {
   production: ${PRODUCTION},
   openaiToken: '${TOKEN}',
};`;

const targetPath = './src/environments/environment.ts';
writeFile(targetPath, envConfigFile, (err: any) => {
  if (err) {
    throw console.error(err);
  }
});
