importScripts('JSCPP.es5.min.js');

self.onmessage = function(e) {
    const { code } = e.data;
    const outputLines = [];
    const vizCommands = [];
    
    const config = {
        stdio: {
            write: function(s) {
                const str = String(s);
                if (str.startsWith('__VIZ__:')) {
                    vizCommands.push(str.substring(8).trim().split(':'));
                } else {
                    outputLines.push(str);
                }
            }
        },
        unsigned_overflow: 'warn',
    };

    try {
        JSCPP.run(code, '', config);
        self.postMessage({ success: true, vizCommands, outputLines });
    } catch (err) {
        self.postMessage({ success: false, error: err.message || String(err), outputLines });
    }
};
