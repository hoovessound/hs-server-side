const { spawn } = require('child_process');

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
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['-f', 'bestvideo', this.url, '-g', ...prefix])
            .stdout.on('data', data => {
                resolve(data.toString())
            });
        });
    }

    async getBesetAudio(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['-f', 'bestaudio', this.url, '-g', ...prefix])
            .stdout.on('data', data => {
                resolve(data.toString())
            });
        });
    }

    async getWorstVideo(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['-f', 'worstvideo', this.url, '-g', ...prefix])
            .stdout.on('data', data => {
                resolve(data.toString())
            });
        });
    }

    async getWorstAudio(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['-f', 'worstaudio', this.url, '-g', ...prefix])
            .stdout.on('data', data => {
                resolve(data.toString())
            });
        });
    }

    async getDescription(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['--get-description', this.url, ...prefix])
            .stdout.on('data', data => {
                resolve(data.toString())
            });
        });
    }

    async getCoverArt(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['--get-thumbnail', this.url, ...prefix])
            .stdout.on('data', data => {
                resolve(data.toString())
            });
        });
    }

    async getTitle(){
        return new Promise((resolve, reject) => {
            spawn('youtube-dl', ['--get-title', this.url, ...prefix])
            .stdout.on('data', data => {
                resolve(data.toString())
            });
        });
    }
}

module.exports = {
    youtubeDlCLI,
};