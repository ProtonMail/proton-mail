# Proton Account

Proton Account built with React.


>**⚠ If you use Windows plz follow this document before anything else [how to prepare Windows](https://github.com/ProtonMail/proton-shared/wiki/setup-windows)**



## Basic installation

> :warning: if you are a proton dev, you will need the file `appConfig.json`

To set up the project, follow the steps below:

1. Clone the repository
2. `$ npm ci`
3. `$ npm start`

It's going to create a server available on https://localhost:8080

cf:

```sh
$ npm start

> proton-account@4.0.0-beta.5 start /tmp/proton-account
> proton-pack dev-server $npm_package_config_publicPathFlag --appMode=standalone

[proton-pack] Missing file appConfig.json.
[proton-pack] [DEPREACTION NOTICE] Please rename your file env.json to appConfig.json.
[proton-pack] Missing file env.json.
[proton-pack] ✓ generated /tmp/proton-account/src/app/config.ts
➙ Dev server: http://localhost:8081/account/
➙ Dev server: http://192.168.1.88:8081/account/
➙ API: https://mail.protonmail.com/api


ℹ ｢wds｣: Project is running at http://localhost/
ℹ ｢wds｣: webpack output is served from /account/
ℹ ｢wds｣: Content not from webpack is served from /tmp/proton-account/dist
ℹ ｢wds｣: 404s will fallback to /account/
ℹ ｢wdm｣:    3196 modules
ℹ ｢wdm｣: Compiled successfully.
```

> Here on the port 8081 as the 8080 was not available. We auto detect what is available.


## Commands

- `$ npm start`

Run develop server with a login page (mode standalone). It's going to run a server on the port **8080** if available.
> If it is not available we auto detect what is available

- `$ npm test`

Run the tests

- `$ npm run lint`

Lint the sources via eslint

- `$ npm run pretty`

Prettier sources (we have a hook post commit to run it)

- `$ npm run check-types`

Validate TS types

- `$ npm run bundle`

Create a bundle ready to deploy (prepare app + build + minify)

[more informations](https://github.com/ProtonMail/proton-bundler)

- `$ npm run build`

Build the app (build + minify). Bundle will run this command.

- `$ npm run build:standalone`

Same as the previous one BUT with a login page. When we deploy live,the login state is on another app.But when we only deploy this app when we dev, we need to be able to login.

- `$ npm run deploy` and `$ npm run deploy:standalone`

It's to deploy to a branch `deploy-branch`. A bundle based on `build` or `build:standalone`.

Flags:
  - `--api <key>`: type of api to use for deploy ex: blue,dev,proxy,prod
  - `--branch  <deploy-branch>`: target for the subdomain to deploy

[more informations](https://github.com/ProtonMail/proton-bundler)

- `$ npm run i18n:validate**`

Validate translations (context, format etc.)

## Create a new version

We use the command [npm version](https://docs.npmjs.com/cli/version)

## Help us to translate the project

You can help us to translate the application on [crowdin](https://crowdin.com/project/protonmail)

