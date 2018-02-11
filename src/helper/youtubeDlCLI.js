const exec = require('child-process-promise').exec;

const prefix = '--no-progress --quiet --simulate --no-warnings --ignore-errors --no-call-home';

class youtubeDlCLI {
    constructor(url){
        this.url = url;
    }
    async getUrl(){
        const query = `youtube-dl -f bestaudio ${this.url} -g ${prefix}`;
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