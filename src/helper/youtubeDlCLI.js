const exec = require('node-exec-promise').execFile;

const prefix = [
    '--no-progress',
    '--quiet',
    '--simulate',
    '--no-warnings',
    '--ignore-errors',
    '--no-call-home',
];

class youtubeDlCLI {
    constructor(url){
        this.url = url;
    }
    async getBestVideo(){
        const result = await exec('youtube-dl', ['-f', 'bestvideo', this.url, '-g', ...prefix]);
        return result.stdout;
    }

    async getBesetAudio(){
        const result = await exec('youtube-dl', ['-f', 'bestaudio', this.url, '-g', ...prefix]);
        return result.stdout;
    }

    async getWorstVideo(){
        const result = await exec('youtube-dl', ['-f', 'worstvideo', this.url, '-g', ...prefix]);
        return result.stdout;
    }

    async getWorstAudio(){
        const result = await exec('youtube-dl', ['-f', 'worstaudio', this.url, '-g', ...prefix]);
        return result.stdout;
    }

    async getDescription(){
        const result = await exec('youtube-dl', ['--get-description', this.url, ...prefix]);
        return result.stdout;
    }

    async getCoverArt(){
        const result = await exec('youtube-dl', ['--get-thumbnail', this.url, ...prefix]);
        return result.stdout.split('\n')[0];
    }

    async getTitle(){
        const result = await exec('youtube-dl', ['--get-title', this.url, ...prefix]);
        return result.stdout;
    }
}

module.exports = {
    youtubeDlCLI,
};