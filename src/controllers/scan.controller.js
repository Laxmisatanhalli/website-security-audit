const { Website, Scan, ScanResult } = require('../models');
const { execFile } = require('child_process');
const path = require('path');

function runPythonScanner(url) {
    return new Promise((resolve, reject) => {
        const scannerPath = path.resolve(
            __dirname,
            '../../scanner/scanner.py'
        );

        execFile(
            'python',
            [scannerPath],
            {
                timeout: 120000,
                maxBuffer: 10 * 1024 * 1024
            },
            (error, stdout, stderr) => {
                if (error) {
                    console.error('Python scanner error:', stderr);

                    return reject(
                        new Error('Security scanner failed')
                    );
                }

                try {
                    const results = JSON.parse(stdout);
                    resolve(results);
                } catch (parseError) {
                    console.error('Scanner output:', stdout);
                    reject(
                        new Error('Invalid scanner output')
                    );
                }
            }
        );
    });
}


async function createScan(req, res) {
    try {
        const { url } = req.body;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                message: 'Website URL is required'
            });
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(400).json({
                message: 'Invalid website URL'
            });
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({
                message: 'Only HTTP and HTTPS URLs are supported'
            });
        }

        const website = await Website.create({
            url: parsedUrl.toString(),
            UserId: req.user.id
        });

        const scan = await Scan.create({
            WebsiteId: website.id,
            status: 'running'
        });

        try {
            const results = await runPythonScanner(
                parsedUrl.toString()
            );

            await ScanResult.bulkCreate(
                results.map(result => ({
                    ScanId: scan.id,
                    module: result.module,
                    severity: result.severity,
                    issue: result.issue,
                    recommendation: result.recommendation
                }))
            );

            await scan.update({
                status: 'completed'
            });

            return res.status(201).json({
                message: 'Website scan completed',
                scanId: scan.id,
                website: website.url,
                results
            });

        } catch (scannerError) {
            await scan.update({
                status: 'failed'
            });

            return res.status(500).json({
                message: 'Website scan failed'
            });
        }

    } catch (error) {
        console.error('createScan error:', error);

        return res.status(500).json({
            message: 'Internal server error'
        });
    }
}


module.exports = {
    createScan
};