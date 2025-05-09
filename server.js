const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// ADB Connection Check
app.get('/check-adb', (req, res) => {
    exec('adb devices', (error, stdout) => {
        res.json({
            connected: stdout.includes('\tdevice')
        });
    });
});

// List Packages with Filters
app.get('/list-packages', (req, res) => {
    const filter = req.query.filter || ''; // -s, -3, or empty
    exec(`adb shell pm list packages ${filter}`, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: stderr || error.message });
        res.json({ output: stdout });
    });
});

// Uninstall Package
app.post('/uninstall-package', (req, res) => {
    const { packageName } = req.body;
    exec(`adb shell pm uninstall --user 0 ${packageName}`, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: stderr || error.message });
        res.json({ output: `Package ${packageName} uninstalled` });
    });
});

// Reinstall Package
app.post('/reinstall-package', (req, res) => {
    const { packageName } = req.body;
    exec(`adb shell cmd package install-existing ${packageName}`, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: stderr || error.message });
        res.json({ output: `Package ${packageName} reinstalled` });
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});