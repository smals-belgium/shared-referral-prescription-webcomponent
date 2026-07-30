import { TestEnvironment } from 'jest-environment-jsdom';

class CustomEnvironment extends TestEnvironment {
  constructor(config: any, context: any) {
    super(config, context);

    // Remove Jest's default handler set up in super()
    this.dom?.virtualConsole.removeAllListeners('jsdomError');

    // Replace with filtered version
    this.dom?.virtualConsole.on('jsdomError', (e: Error) => {
      if (e.message.includes('Could not parse CSS stylesheet')) return;
      console.error(e);
    });
  }
}

export default CustomEnvironment;
