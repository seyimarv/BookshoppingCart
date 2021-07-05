const fs = require('fs')

const deleteFile = (filepath) => {
    fs.unlink(filepath, (err) => {
        if(err) {
            throw (err)
        }
    })
} // a method that can be passed to edit a file path and delete the file.

exports.deleteFile = deleteFile