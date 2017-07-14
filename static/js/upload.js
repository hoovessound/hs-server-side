const fileInput = document.querySelector('#file');
const coverImage = document.querySelector('#image');
const uploadForm = document.querySelector('#uploadForm');
const progressBar = document.querySelector('#progress');
const errorMessgae = document.querySelector('.error');
const title = document.querySelector('#title');
const ajax = new XMLHttpRequest();

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    // Set the title
    let fileName = file.name;
    fileName = fileName.split('.')[0];
    fileName = fileName.replace(/\W/igm, '');
    fileName = fileName.replace(/ /igm, '-');
    title.value = fileName;
});

uploadForm.addEventListener('submit', e => {
    // Upload the file
    e.preventDefault();
    if(fileInput.files[0]){
        const file = fileInput.files[0];
        const ajax = new XMLHttpRequest();
        const form = new FormData();
        ajax.open('POST', '/api/upload');
        form.append('audio', file);
        form.append('title', title.value);
        form.append('image', coverImage.files[0]);
        ajax.setRequestHeader('token', $token);
        ajax.send(form);
        ajax.onload = function() {
            if(ajax.readyState === 4 && ajax.status === 200) {
                const response = JSON.parse(ajax.response);
                if(response.error){
                    errorMessgae.innerHTML = response.msg;
                }else{
                    window.open(response.url, '_self');
                }
            }
        }

        ajax.upload.addEventListener('progress', e => {
            const progress = (e.loaded / e.total) * 100;
            progressBar.value = progress;
        }, false);
    }
});