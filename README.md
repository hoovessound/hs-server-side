# HoovesSound Servier Side

# Getting started

## Local development

Set up the correct environment variables via the `.env` file

Make your own `.env` file by using the existing template `.env.default`
```bash
$ mv .env.default .env
```

Install the correct packages
```bash
$ yarn
```

Start the server
```bash
$ yarn start
```


# Native Dependencies
1. Imagemagick
    * Please making sure you have Imagemagick installed, because the application will process the `Track Cover` and the `Profile Picture` before uploading to GCS | [Download Imagemagick](https://www.imagemagick.org/script/download.php)

---

## Production

Using docker, with the correct environment variables

```bash
$ docker run -p 3000:3000 --rm --name hs_serer_side -e <correct variables> moongod101/hs-client-side
```

### Port
The default port will be `3000`
