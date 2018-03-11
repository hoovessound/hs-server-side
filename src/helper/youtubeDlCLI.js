const { spawn } = require('child_process');

const prefix = [
    '--no-progress',
    '--quiet',
    '--simulate',
    '--no-warnings',
    '--force-ipv4',
    '--skip-download',
];

class youtubeDlCLI {
    constructor(url){
        this.url = url;
    }

    async getBesetAudio(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['-f', 'bestaudio', '-g', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString().trim());
            });
        });
    }

    async getDescription(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['--get-description', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString().trim());
            });
        });
    }

    async getCoverArt(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['--get-thumbnail', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString().trim());
            });
        });
    }

    async getTitle(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['--get-title', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString().trim());
            });
        });
    }
}

module.exports = {
    youtubeDlCLI,
};