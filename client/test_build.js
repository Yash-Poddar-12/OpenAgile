const { build } = require('vite');

(async () => {
    try {
        await build({
            root: __dirname,
            logLevel: 'error'
        });
        console.log("SUCCESS");
    } catch (e) {
        require('fs').writeFileSync('build_error.txt', e.stack || e.message);
        console.error("FAILED");
    }
})();
