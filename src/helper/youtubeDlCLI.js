const exec = require('child-process-promise').exec;

const prefix = '--no-progress --quiet --simulate --no-warnings --ignore-errors --no-call-home';

class youtubeDlCLI {
    constructor(url){
        this.url = url;
    }
    async getBestVideo(){
        const query = `youtube-dl -f bestvideo ${this.url} -g ${prefix}`;
        const result = await exec(query);
        return result.stdout;
    }

    async getBesetAudio(){
        const query = `youtube-dl -f bestaudio ${this.url} -g ${prefix}`;
        const result = await exec(query);
        return result.stdout;
    }

    async getWorstVideo(){
        const query = `youtube-dl -f worstvideo ${this.url} -g ${prefix}`;
        const result = await exec(query);
        return result.stdout;
    }

    async getWorstAudio(){
        const query = `youtube-dl -f worstaudio ${this.url} -g ${prefix}`;
        const result = await exec(query);
        return result.stdout;
    }

    async getDescription(){
        const query = `youtube-dl --get-description ${this.url} ${prefix}`;
        const result = await exec(query);
        return result.stdout;
    }

    async getCoverArt(){
        const query = `youtube-dl --get-thumbnail ${this.url} ${prefix}`;
        const result = await exec(query);
        return result.stdout.split('\n')[0];
    }

    async getTitle(){
        const query = `youtube-dl --get-title ${this.url} ${prefix}`;
        const result = await exec(query);
        return result.stdout;
    }
}

module.exports = {
    youtubeDlCLI,
};