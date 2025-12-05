const packageJson = require('../../package.json');
const fs = require('fs');
const concat = require('concat');
const path = require('path');
const camelToKebabCase = require('camel-to-kebab');
const child_process = require('child_process');

const excludedProjects = [void 0];
const projectsDir = 'wrappers/components';
const outputDir = 'dist';
const filesToPack = ['scripts.js', 'main.js'];
// const documentation = ['docs/public-doc.md'];

(async () => {
  fs.readdir(projectsDir, (err, files) => {
    const buildable = files.filter(file => !excludedProjects?.includes(file));

    console.log(`:: Building and packaging ${buildable.length} webcomponent(s) :`, buildable, '\n');

    if (buildable.length) {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      console.log(`:::: Installing dependencies :\n`);
      child_process.execSync(`npm install`, {
        stdio: [0, 1, 2],
      });
    }

    // let globalDocs = [...documentation];

    buildable.forEach(file => {
      console.log(`:::: Building and packaging ${file} :\n`);

      // const projectDirectory = `${projectsDir}/${file}`;
      const projectVersion = packageJson.version;
      // const packageableDocumentation = documentation.map((f) => path.join(projectDirectory, f));

      const packageDirectory = `${outputDir}/${file}/`;
      const buildDirectory = `${packageDirectory}/mags/`;

      console.log(`:::::: Building ${file}@${projectVersion}...`);
      child_process.execSync(`npm run build:${file}`, {
        stdio: [0, 1, 2],
      });
      console.log(`:::::: Success.\n`);

      if (!fs.existsSync(packageDirectory)) {
        fs.mkdirSync(packageDirectory);
      }

      // console.log(`:::::::: Packaging documentation...`);
      // globalDocs = [...globalDocs, ...packageableDocumentation];
      // concat([...packageableDocumentation], path.join(versionDirectory, `README.md`));
      // console.log(`:::::::: Success.\n`);

      console.log(`:::: Successfully built and packaged ${file}@${projectVersion} webcomponent.\n`);

      console.log(`:: Generating package.json...\n`);

      const { name, version, description, type, repository, keywords, author, license } = packageJson;

      fs.writeFileSync(
        path.join(buildDirectory, `package.json`),
        JSON.stringify({
          name: `@smals-belgium-shared/uhmep-mags-${file.replace('wc-', '')}`,
          version,
          description,
          type,
          repository,
          keywords,
          author,
          license,
        })
      );
    });

    console.log(`:: Successfully built and packaged ${buildable.length} webcomponent(s).\n`);
  });
})();
