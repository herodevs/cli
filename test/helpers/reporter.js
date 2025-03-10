const mocha = require("mocha");


class CustomReporter extends mocha.reporters.Spec {
  constructor(runner) {
    super(runner);

    runner.on("start", () => {
      console.clear(); // Clear screen on each run
      console.log("\n🚀 Running Tests...\n");
    });

    // runner.on("pass", (test) => {
    //   console.log(`✅ ${test.fullTitle()}`);
    // });

    // runner.on("fail", (test, err) => {
    //   console.log(`❌ ${test.fullTitle()}\n\t${err.message}`);
    // });

    // runner.on("end", () => {
    //   console.log(`\n🎉 Tests complete. ${this.stats.passes} passed, ${this.stats.failures} failed.`);
    // });
  }
}

module.exports = CustomReporter;
