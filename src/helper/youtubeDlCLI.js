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
    async getBestVideo(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['-f', 'bestvideo', '-g', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString());
                // console.log(data.toString());
            });
        });
    }

    async getBesetAudio(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['-f', 'bestaudio', '-g', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString());
                // console.log(data.toString());
            });
        });
    }

    async getWorstVideo(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['-f', 'worstvideo', '-g', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString());
                // console.log(data.toString());
            });
        });
    }

    async getWorstAudio(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['-f', 'worstaudio', '-g', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString());
                // console.log(data.toString());
            });
        });
    }

    async getDescription(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['--get-description', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString());
                // console.log(data.toString());
            });
        });
    }

    async getCoverArt(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['--get-thumbnail', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString());
                // console.log(data.toString());
            });
        });
    }

    async getTitle(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['--get-title', ...prefix, this.url])
            .stdout.on('data', data => {
                resolve(data.toString());
                // console.log(data.toString());
            });
        });
    }
}

module.exports = {
    youtubeDlCLI,
};